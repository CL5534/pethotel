import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector.jsx'
import PaymentResultCard from '../components/payment/PaymentResultCard.jsx'
import PaymentSummaryCard from '../components/payment/PaymentSummaryCard.jsx'
import { confirmReservation, getDraft } from '../services/reservationService.js'
import './PaymentPage.css'

function PaymentPage() {
  const navigate = useNavigate()
  const [method, setMethod] = useState('CARD')
  const [result, setResult] = useState(null)

  const draft = useMemo(() => getDraft(), [])

  const handlePay = async () => {
    if (!draft) {
      setResult({ success: false, message: '결제할 예약 정보가 없습니다.' })
      return
    }

    window.open('https://www.tosspayments.com/', '_blank', 'noopener,noreferrer')

    try {
      await confirmReservation(draft.reservationCode)
      setResult({
        success: true,
        message: `${method === 'CARD' ? '카드 결제' : '간편 결제'} 요청이 시작되었습니다. 결제 완료 후 예약상태가 예약확정으로 반영됩니다.`,
      })
    } catch (exception) {
      setResult({
        success: false,
        message: exception.message || '결제 상태 반영에 실패했습니다. 다시 시도해 주세요.',
      })
    }
  }

  return (
    <section className="paymentPage">
      <header className="paymentHeading">
        <p className="sectionEyebrow">Payment</p>
        <h1>결제</h1>
        <p>요구사항 기준으로 카드/간편결제 선택 후 토스페이먼츠 결제 페이지로 이동합니다.</p>
      </header>

      <div className="paymentLayout">
        <PaymentSummaryCard draft={draft} />
        <PaymentMethodSelector selectedMethod={method} onSelectMethod={setMethod} />
      </div>

      <div className="paymentActions">
        <button type="button" className="paymentPrimaryButton" onClick={handlePay}>결제하기</button>
        <button type="button" className="paymentSecondaryButton" onClick={() => navigate('/booking')}>예약으로 돌아가기</button>
      </div>

      <PaymentResultCard result={result} />
    </section>
  )
}

export default PaymentPage
