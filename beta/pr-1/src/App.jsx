import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabaseClient.js';
import './App.css';

const PLAYERS = ['Eliott', 'Timéo', 'Lilouan'];
const INITIAL_SCORE = 4;

const formatDate = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        setErrorMessage("Impossible de charger les scores. Vérifie la configuration Supabase.");
      } else {
        setEvents(data ?? []);
      }
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('public:events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          setEvents((current) => {
            const exists = current.some((event) => event.id === payload.new.id);
            if (exists) {
              return current;
            }
            return [...current, payload.new].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'events' },
        (payload) => {
          setEvents((current) => current.filter((event) => event.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const scores = useMemo(() => {
    const base = PLAYERS.reduce((acc, player) => {
      acc[player] = INITIAL_SCORE;
      return acc;
    }, {});

    for (const event of events) {
      if (base[event.player] !== undefined) {
        base[event.player] += event.delta;
      }
    }

    return base;
  }, [events]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [events]);

  const openAction = (player, delta) => {
    setPendingAction({ player, delta });
    setComment('');
    setErrorMessage(null);
  };

  const closeAction = () => {
    setPendingAction(null);
    setComment('');
  };

  const submitAction = async () => {
    if (!pendingAction) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const { player, delta } = pendingAction;
    const { data, error } = await supabase
      .from('events')
      .insert({
        player,
        delta,
        comment: comment.trim() === '' ? null : comment.trim(),
      })
      .select()
      .maybeSingle();

    if (error) {
      setErrorMessage("L'enregistrement du point a échoué. Essaie à nouveau.");
    } else if (data) {
      setEvents((current) =>
        [...current, data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      );
      closeAction();
    }

    setIsSubmitting(false);
  };

  const handleUndo = async () => {
    if (sortedEvents.length === 0) {
      return;
    }

    const lastEvent = sortedEvents[0];
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.from('events').delete().eq('id', lastEvent.id);

    if (error) {
      setErrorMessage("Impossible d'annuler le dernier point. Essaie à nouveau.");
    } else {
      setEvents((current) => current.filter((event) => event.id !== lastEvent.id));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Belgique vs France</h1>
        <p className="tagline">Tableau de score en direct pour Eliott, Timéo et Lilouan</p>
      </header>

      <main className="app-main">
        {errorMessage && <div className="error-banner">{errorMessage}</div>}
        {loading ? (
          <div className="loading">Chargement en cours…</div>
        ) : (
          <>
            <section className="scores-grid">
              {PLAYERS.map((player) => (
                <article key={player} className="score-card">
                  <h2>{player}</h2>
                  <p className="score-value">{scores[player]}</p>
                  <div className="actions">
                    <button
                      className="primary"
                      onClick={() => openAction(player, +1)}
                      disabled={isSubmitting}
                    >
                      +1 point
                    </button>
                    <button
                      className="secondary"
                      onClick={() => openAction(player, -1)}
                      disabled={isSubmitting || scores[player] <= 0}
                    >
                      Retirer 1
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section className="history">
              <div className="history-header">
                <h3>Historique des points</h3>
                <button
                  type="button"
                  className="undo"
                  onClick={handleUndo}
                  disabled={isSubmitting || sortedEvents.length === 0}
                >
                  Annuler le dernier point
                </button>
              </div>

              {sortedEvents.length === 0 ? (
                <p className="empty-history">
                  Aucun point enregistré pour l'instant. Appuie sur les boutons pour commencer !
                </p>
              ) : (
                <ul className="history-list">
                  {sortedEvents.map((event) => (
                    <li key={event.id} className={`history-item ${event.delta > 0 ? 'plus' : 'minus'}`}>
                      <div>
                        <strong>{event.player}</strong>{' '}
                        <span className="delta">{event.delta > 0 ? '+1' : '-1'}</span>
                        <span className="time">{formatDate(event.created_at)}</span>
                      </div>
                      {event.comment && <p className="comment">{event.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {pendingAction && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>{pendingAction.delta > 0 ? 'Ajouter un point' : 'Retirer un point'}</h2>
            <p>
              {pendingAction.delta > 0 ? 'Bravo !' : 'Oups…'} Quelle est la raison pour {pendingAction.player} ?
              (optionnel)
            </p>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Commentaire (facultatif)"
              rows={3}
            />
            <div className="modal-actions">
              <button className="secondary" onClick={closeAction} disabled={isSubmitting}>
                Annuler
              </button>
              <button className="primary" onClick={submitAction} disabled={isSubmitting}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
