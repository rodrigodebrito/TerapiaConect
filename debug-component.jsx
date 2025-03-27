{/* Componente de debug - Cole isso após a div do FullCalendar */}
<div className="row mt-4">
  <div className="col">
    <div className="card bg-light border-info">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Debug: Eventos Específicos ({events.filter(e => e.isSpecificDate).length})</h5>
        <button 
          className="btn btn-sm btn-outline-secondary"
          onClick={() => {
            console.log('Forçando atualização do calendário');
            const calendarApi = document.querySelector('.fc').closest('.fc').fullCalendar;
            if (calendarApi) {
              calendarApi.refetchEvents();
              calendarApi.render();
            } else {
              toast.info('API do calendário não disponível');
            }
          }}
        >
          Atualizar Calendário
        </button>
      </div>
      <div className="card-body">
        {events.filter(e => e.isSpecificDate).length > 0 ? (
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Horário</th>
                </tr>
              </thead>
              <tbody>
                {events.filter(e => e.isSpecificDate).map(event => (
                  <tr key={event.id}>
                    <td>{event.id.substring(0, 10)}...</td>
                    <td>{event.date || (event.start && typeof event.start === 'string' ? event.start.split('T')[0] : 'N/A')}</td>
                    <td>{event.startTime} - {event.endTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">Nenhum evento específico cadastrado.</p>
        )}
      </div>
    </div>
  </div>
</div> 