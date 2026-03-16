import './CommunityCategorySection.css'

function CommunityCategorySection({ categories, activeCategory, onChangeCategory }) {
  return (
    <section className="communityCategorySection">
      <div className="communityCategoryTabs">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`communityTabButton${activeCategory === category ? ' isActive' : ''}`}
            onClick={() => onChangeCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </section>
  )
}

export default CommunityCategorySection
