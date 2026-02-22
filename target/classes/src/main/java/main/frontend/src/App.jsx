import { useState } from "react";
import HomePage from "./pages/HomePage";
import SelectModePage from "./pages/SelectModePage";
import MinionSetupPage from "./pages/MinionSetupPage";

export default function App() {
    const [page, setPage] = useState("home");
    const [mode, setMode] = useState(null);

    const handleSelectMode = (selectedMode) => {
        setMode(selectedMode);
        setPage("minion");
    };

    return (
        <div className="app">
            {page === "home" && (
                <HomePage
                    onStart={() => setPage("mode")}
                    onRules={() => alert("Rules: ...")}
                />
            )}
            {page === "mode" && (
                <SelectModePage
                    onBack={() => setPage("home")}
                    onNext={handleSelectMode}
                />
            )}
            {page === "minion" && (
                <MinionSetupPage
                    onBack={() => setPage("mode")}
                    onNext={(count) => alert(`Mode: ${mode}, Minions: ${count}`)}
                />
            )}
        </div>
    );
}