export default function HomePage({ onStart, onRules }) {
    return (
        <div className="page home">
            <div className="overlay">
                <div className="title">
                    <h1 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: "2rem", color: "#2c2c1a", textAlign: "center", lineHeight: 1.3 }}>
                        KOMBAT<br />GAME
                    </h1>
                </div>

                <div style={{ position: "absolute", bottom: "70px", right: "30px", fontSize: "2rem" }}>
                    ⚔️
                </div>

                <div className="buttons">
                    <button className="btn" onClick={onRules}>RULES</button>
                    <button className="btn" onClick={onStart}>START GAME</button>
                </div>
            </div>
        </div>
    );
}