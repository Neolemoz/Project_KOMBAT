import { useState } from "react";

const OPTIONS = ["I", "II", "III", "IV", "V"];

export default function MinionSetupPage({ onBack, onNext }) {
    const [selected, setSelected] = useState(null);

    return (
        <div className="page minion-setup">
            <div className="question">
                <h3 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: "#2c2c1a" }}>
                    How many minion types do you want?
                </h3>
            </div>

            <div className="minion-options">
                {OPTIONS.map((opt) => (
                    <div
                        key={opt}
                        className={`minion-card ${selected === opt ? "active" : ""}`}
                        onClick={() => setSelected(opt)}
                    >
                        {opt}
                    </div>
                ))}
            </div>

            <div className="players">
                <button className="btn back-btn" style={{ position: "static" }} onClick={onBack}>
                    ◀ BACK
                </button>
                {selected && (
                    <button className="btn" onClick={() => onNext(selected)}>
                        NEXT ▶
                    </button>
                )}
            </div>
        </div>
    );
}