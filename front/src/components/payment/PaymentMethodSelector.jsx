const METHODS = [
  { id: 'CARD', label: '카드 결제' },
  { id: 'EASY_PAY', label: '간편 결제' },
]

function PaymentMethodSelector({ selectedMethod, onSelectMethod }) {
  return (
    <section className="paymentCard">
      <h2>결제수단 선택</h2>
      <div className="paymentMethodGrid">
        {METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            className={`paymentMethodButton${selectedMethod === method.id ? ' isSelected' : ''}`}
            onClick={() => onSelectMethod(method.id)}
          >
            {method.label}
          </button>
        ))}
      </div>
      <p className="paymentHint">결제하기를 누르면 토스페이먼츠 결제 페이지로 이동합니다.</p>
    </section>
  )
}

export default PaymentMethodSelector
