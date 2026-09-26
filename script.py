import re

with open('src/pages/Agenda.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'(\s*return\s*\(\s*<>.*?)(?=\n\s*\{/\*\s*Modal de Cadastro/Edição de Agendamento\s*\*/\})'

replacement = '''
  return (
    <>
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Agenda & Recebimentos</h1>
          <p className="page-subtitle">Gerencie suas sessões, sinais e baixas financeiras</p>
        </div>
        <Button className="hidden sm:flex" onClick={() => {
          setEditingAppointment(null);
          setFormData({
            client_id: "",
            date: new Date().toISOString().split("T")[0],
            startTime: "09:00",
            endTime: "10:00",
            status: "Agendado",
            value: 0,
            deposit: 0,
            deposit_date: new Date().toISOString().split("T")[0],
            deposit_link: ""
          });
          setModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-4">
          {/* Cabeçalho Unificado do Calendário Mobile (Estilo Google Agenda) */}
          <div className="bg-card rounded-xl border p-2 shadow-sm space-y-2">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[15px] font-bold capitalize tracking-tight">
                {calendarRef.current ? calendarRef.current.getApi().view.title : ""}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-accent/50 rounded-lg p-0.5">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => calendarRef.current?.getApi().prev()}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => calendarRef.current?.getApi().next()}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center bg-accent/50 p-0.5 rounded-lg border">
                  <Button
                    variant={mobileViewType === 'timeGridDay' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setMobileViewType('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); }}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    Dia
                  </Button>
                  <Button
                    variant={mobileViewType === 'timeGridWeek' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setMobileViewType('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); }}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    Semana
                  </Button>
                  <Button
                    variant={mobileViewType === 'dayGridMonth' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => { setMobileViewType('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); }}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    Mês
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Botão Flutuante (FAB) para Mobile */}
          <Button
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-xl shadow-primary/40 z-50 p-0 flex items-center justify-center"
            onClick={() => {
              setEditingAppointment(null);
              setFormData({
                client_id: "",
                date: new Date().toISOString().split("T")[0],
                startTime: "09:00",
                endTime: "10:00",
                status: "Agendado",
                value: 0,
                deposit: 0,
                deposit_date: new Date().toISOString().split("T")[0],
                deposit_link: ""
              });
              setModalOpen(true);
            }}
          >
            <Plus className="h-6 w-6" />
          </Button>

          <div className="bg-card rounded-xl border p-2 shadow-sm overflow-hidden">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={mobileViewType}
              locale={ptBrLocale}
              events={calendarEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              headerToolbar={false}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              select={handleSelect}
              eventChange={handleEventChange}
              height="calc(100vh - 200px)"
              datesSet={() => {
                setMobileViewType(calendarRef.current?.getApi().view.type || 'timeGridDay');
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            events={calendarEvents}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            select={handleSelect}
            eventChange={handleEventChange}
            height="calc(100vh - 220px)"
          />
        </div>
      )}
'''

match = re.search(pattern, content, flags=re.DOTALL)
if match:
    new_content = content.replace(match.group(1), replacement)
    with open('src/pages/Agenda.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Sucesso!")
else:
    print("Falhou!")
