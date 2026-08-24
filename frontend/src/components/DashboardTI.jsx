import { useEffect, useState } from 'react'
import { estilos, CORES_APP, CORES_TI } from '../styles/theme'
import { useAuth } from '../hooks/useAuth'
import { buscarWidgets } from '../services/dashboardService'
import { traduzirErroApi } from '../utils/traduzirErroApi'
import { dataFimPadrao, dataInicioPadrao } from '../utils/periodoPadrao'
import { IconBarChart } from './icons'
import EstadoRequisicao from './EstadoRequisicao'
import WidgetRenderer from './WidgetRenderer'

// Dashboard TI — tela de CONSULTA (sem nenhum controle de edição, isso fica
// em CriarDashboard.jsx). Busca a configuração de widgets salva
// (GET /dashboard/widgets, compartilhada entre os técnicos) e renderiza um
// <WidgetRenderer /> por widget ativo, na ordem recebida — cada widget
// busca seus próprios dados de métrica, este componente só orquestra o
// período e a lista.
function DashboardTI() {
  const { token, tratarErroApi } = useAuth()
  const [dataInicio, setDataInicio] = useState(dataInicioPadrao)
  const [dataFim, setDataFim] = useState(dataFimPadrao)
  const [widgets, setWidgets] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function buscar() {
    setCarregando(true)
    setErro('')
    try {
      setWidgets(await buscarWidgets(token))
    } catch (e) {
      if (!tratarErroApi(e)) setErro(traduzirErroApi(e))
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const widgetsAtivos = widgets.filter(w => w.ativo)
  const periodo = { dataInicio, dataFim }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: CORES_TI.accentBg, border: `1px solid ${CORES_TI.accentBorda}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CORES_TI.accent }}><IconBarChart width={16} height={16} /></div>
          <h1 style={estilos.sectionTitle}>Dashboard</h1>
        </div>
        <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>Métricas e padrões dos chamados no período selecionado</p>
      </div>

      <div style={{ ...estilos.card, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={estilos.label}>Data início</span>
          <input type="date" value={dataInicio} max={dataFim}
            onChange={e => setDataInicio(e.target.value)}
            style={{ ...estilos.input, width: 'auto', padding: '9px 12px', fontSize: 14 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={estilos.label}>Data fim</span>
          <input type="date" value={dataFim} min={dataInicio} max={dataFimPadrao()}
            onChange={e => setDataFim(e.target.value)}
            style={{ ...estilos.input, width: 'auto', padding: '9px 12px', fontSize: 14 }} />
        </label>
      </div>

      <EstadoRequisicao carregando={carregando} erro={erro} aoTentarNovamente={buscar}>
        {widgetsAtivos.length === 0 ? (
          <div style={{ ...estilos.card, padding: 32, textAlign: 'center' }}>
            <p style={{ color: CORES_APP.textoFraco, fontSize: 14, margin: 0 }}>
              Nenhum widget ativo. Configure em <strong>Criar Dashboard</strong>, na sidebar.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {widgetsAtivos.map(widget => (
              <WidgetRenderer key={widget.id} widget={widget} periodo={periodo} />
            ))}
          </div>
        )}
      </EstadoRequisicao>
    </div>
  )
}

export default DashboardTI
