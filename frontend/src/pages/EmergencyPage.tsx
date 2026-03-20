import type { AppTab, ContactItem } from '../types'

interface EmergencyPageProps {
  primaryContact?: ContactItem
  onEmergency: (symptom: string, notes: string) => Promise<void>
  onOpenTab: (tab: AppTab) => void
}

const SYMPTOMS = [
  { title: '胸痛', detail: '胸口压迫、冒汗、放射痛', notes: '建议立刻呼叫 120。' },
  { title: '呼吸困难', detail: '说话费力、喘不过气', notes: '保持通风，优先求助。' },
  { title: '头晕或意识不清', detail: '站立不稳、说话混乱', notes: '尽量坐下或平躺。' },
  { title: '摔倒', detail: '疑似骨折或无法起身', notes: '不要勉强站起。' },
]

const STEPS = [
  '先拨打 120，或立即联系第一联系人。',
  '保持通话畅通，尽量坐下或平躺，不要独自外出。',
  '如果能说话，清楚说明症状开始时间、当前位置和既往病史。',
  '电话求助后，再查看家属页和留痕记录，方便后续追溯。',
]

export function EmergencyPage({ primaryContact, onEmergency, onOpenTab }: EmergencyPageProps) {
  async function submitEmergency(symptom: string, notes: string) {
    await onEmergency(symptom, notes)
  }

  return (
    <>
      <section className="emergency-stage">
        <div className="panel-head">
          <div>
            <p className="section-kicker">应急主动作</p>
            <h2 className="section-title">先打电话，再补充症状说明。</h2>
          </div>
        </div>

        <p className="section-subtitle">
          这里不做医疗诊断，只做明确可执行的求助引导。若症状加重或无法判断，请直接拨打 120。
        </p>

        <div className="emergency-call-grid">
          <a className="btn danger large block" href="tel:120">
            立即拨打 120
          </a>
          {primaryContact ? (
            <a className="btn secondary large block" href={`tel:${primaryContact.phone}`}>
              联系{primaryContact.relation}：{primaryContact.name}
            </a>
          ) : (
            <button type="button" className="btn ghost large block" onClick={() => onOpenTab('family')}>
              先补充紧急联系人
            </button>
          )}
        </div>

        <div className="emergency-note">
          <p className="journey-title">当前建议</p>
          <p className="journey-text">若胸痛、呼吸困难、摔倒无法起身，请不要等待页面反馈，直接电话求助。</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">快速上报</p>
            <h2 className="section-title">按最接近的症状留痕，方便家属和后台追溯。</h2>
          </div>
        </div>

        <div className="symptom-grid">
          {SYMPTOMS.map((item) => (
            <button
              key={item.title}
              type="button"
              className="symptom-card"
              onClick={() => {
                void submitEmergency(item.title, item.notes)
              }}
            >
              <span className="symptom-title">{item.title}</span>
              <span className="symptom-detail">{item.detail}</span>
              <span className="symptom-note">{item.notes}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="section-kicker">求助步骤</p>
            <h2 className="section-title">照着做，不需要额外判断流程。</h2>
          </div>
        </div>

        <div className="guidance-list">
          {STEPS.map((step, index) => (
            <article key={step} className="guidance-card">
              <span className="step-index">{index + 1}</span>
              <p className="journey-text">{step}</p>
            </article>
          ))}
        </div>

        <div className="btn-row">
          <button type="button" className="btn ghost" onClick={() => onOpenTab('family')}>
            查看联系人与关键记录
          </button>
        </div>
      </section>
    </>
  )
}
