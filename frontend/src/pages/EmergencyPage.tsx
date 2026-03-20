import type { AppTab, ContactItem } from '../types'

interface EmergencyPageProps {
  primaryContact?: ContactItem
  onEmergency: (symptom: string, notes: string) => Promise<void>
  onOpenTab: (tab: AppTab) => void
}

export function EmergencyPage({ primaryContact, onEmergency, onOpenTab }: EmergencyPageProps) {
  async function submitEmergency(symptom: string) {
    await onEmergency(symptom, '')
  }

  return (
    <>
      <section className="panel">
        <h2 className="panel-title">紧急模式</h2>
        <div className="emergency-banner">
          <p>此页面只做求助引导，不做医疗诊断。若症状加重，请优先拨打 120。</p>
        </div>

        <div className="btn-row">
          <a className="btn danger" href="tel:120">
            立即拨打 120
          </a>
          {primaryContact ? (
            <a className="btn secondary" href={`tel:${primaryContact.phone}`}>
              呼叫{primaryContact.relation}
            </a>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">快速症状上报</h2>
        <div className="btn-row">
          <button type="button" className="btn danger" onClick={() => void submitEmergency('胸痛')}>
            胸痛
          </button>
          <button type="button" className="btn danger" onClick={() => void submitEmergency('头晕')}>
            头晕
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={() => void submitEmergency('呼吸困难')}
          >
            呼吸困难
          </button>
          <button type="button" className="btn danger" onClick={() => void submitEmergency('摔倒')}>
            摔倒
          </button>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">建议步骤</h2>
        <ol className="step-list">
          <li>保持通话畅通，先联系 120 或家属。</li>
          <li>坐下或平躺，尽量保持呼吸平稳。</li>
          <li>在家属页查看是否已有应急记录。</li>
        </ol>
        <button type="button" className="btn primary" onClick={() => onOpenTab('family')}>
          查看联系人与记录
        </button>
      </section>
    </>
  )
}
