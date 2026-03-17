import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector.jsx'
import PaymentResultCard from '../components/payment/PaymentResultCard.jsx'
import PaymentSummaryCard from '../components/payment/PaymentSummaryCard.jsx'
import { confirmReservation, createMockPaymentResult, getDraft } from '../services/reservationService.js'
import './PaymentPage.css'

const ENABLE_PAYMENT_MOCK = (import.meta.env.VITE_PAYMENT_MOCK ?? 'true') !== 'false'

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function PaymentPage() {
  const navigate = useNavigate()
  const [method, setMethod] = useState('CARD')
  const [mockScenario, setMockScenario] = useState('SUCCESS')
  const [result, setResult] = useState(null)

  const draft = useMemo(() => getDraft(), [])

  const handlePay = async () => {
    if (!draft) {
      setResult({ success: false, message: '결제할 예약 정보가 없습니다.' })
      return
    }

    if (ENABLE_PAYMENT_MOCK) {
      await delay(700)
      const mockResult = createMockPaymentResult({
        reservationCode: draft.reservationCode,
        method,
        scenario: mockScenario,
      })

      if (mockResult.status === 'SUCCESS') {
        setResult({
          success: true,
          message: `[모의결제] ${method === 'CARD' ? '카드 결제' : '간편 결제'}가 완료된 것으로 처리했습니다.`,
          paymentKey: mockResult.paymentKey,
          orderId: mockResult.orderId,
          transactionId: mockResult.transactionId,
        })
        return
      }

      setResult({
        success: false,
        message: `[모의결제] ${mockResult.failReason}`,
        paymentKey: mockResult.paymentKey,
        orderId: mockResult.orderId,
        transactionId: mockResult.transactionId,
      })
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
        <p>
          {ENABLE_PAYMENT_MOCK
            ? '개발용 모의결제 모드입니다. 결제하기를 누르면 선택한 시나리오로 처리됩니다.'
            : '요구사항 기준으로 카드/간편결제 선택 후 토스페이먼츠 결제 페이지로 이동합니다.'}
        </p>
      </header>

      <div className="paymentLayout">
        <PaymentSummaryCard draft={draft} />
        <PaymentMethodSelector selectedMethod={method} onSelectMethod={setMethod} />
      </div>

      {ENABLE_PAYMENT_MOCK ? (
        <div className="paymentMockBar">
          <p>모의결제 시나리오</p>
          <div className="paymentMockOptions">
            <label><input type="radio" name="mockScenario" checked={mockScenario === 'SUCCESS'} onChange={() => setMockScenario('SUCCESS')} /> 성공</label>
            <label><input type="radio" name="mockScenario" checked={mockScenario === 'FAIL'} onChange={() => setMockScenario('FAIL')} /> 실패</label>
            <label><input type="radio" name="mockScenario" checked={mockScenario === 'CANCEL'} onChange={() => setMockScenario('CANCEL')} /> 취소</label>
          </div>
        </div>
      ) : null}

      <div className="paymentActions">
        <button type="button" className="paymentPrimaryButton" onClick={handlePay}>결제하기</button>
        <button type="button" className="paymentSecondaryButton" onClick={() => navigate('/booking')}>예약으로 돌아가기</button>
      </div>

      <PaymentResultCard result={result} onRetry={handlePay} />
    </section>
  )
}

export default PaymentPage
