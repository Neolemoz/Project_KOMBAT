export default function SelectModePage({ onBack, onNext }) {
    return (
        <div className="page select-mode">
            <div className="heading">
                <h2 style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", color: "#2c2c1a" }}>
                    SELECT MODE
                </h2>
            </div>

            <div className="mode-container">
                {["DUEL", "SOLO", "AUTO"].map((mode) => (
                    <div key={mode} className="mode-card" onClick={() => onNext(mode)}>
                        {mode}
                    </div>
                ))}
            </div>

            <button className="btn back-btn" onClick={onBack}>
                ◀ BACK
            </button>
        </div>
    );
}