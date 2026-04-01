import { TraceEvent } from "@/lib/types";

export function TraceTimeline({ events }: { events: TraceEvent[] }) {
  if (events.length === 0) {
    return <div className="empty-state">No trace events recorded for this batch yet.</div>;
  }

  return (
    <div className="trace-list">
      {events.map((event) => (
        <div key={event.id} className="trace-step">
          <div className="trace-step-header">
            <div>
              <h3>{event.title}</h3>
              <p>{event.detail}</p>
            </div>
            <span className={`status-pill ${event.status === "flagged" ? "status-danger" : event.status === "live" ? "status-warning" : "status-success"}`}>
              {event.status}
            </span>
          </div>
          <div className="trace-step-meta">
            <span>{new Date(event.timestamp).toLocaleString()}</span>
            {event.txHash ? <span className="mono">{event.txHash}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
