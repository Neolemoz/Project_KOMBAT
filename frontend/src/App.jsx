import { useState } from 'react'
import Home from './pages/Home'
import ModeSelectPage from './pages/ModeSelectPage'
import MinionTypePage from './pages/MinionTypePage'
import ChooseMinionPage from './pages/ChooseMinionPage'
import MinionStrategyPage from './pages/MinionStrategyPage'
import GamePage from './pages/GamePage'

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('home')
    const [gameMode, setGameMode] = useState('DUEL')

    // 👈 เพิ่ม state เก็บ "I", "II" ที่เลือกมาจากหน้า TypePage
    const [selectedTypeCount, setSelectedTypeCount] = useState("I")

    // เก็บรายการมินเนี่ยน (พร้อมรูปและชื่อ) ที่ส่งต่อไปหน้า Strategy
    const [selectedMinionSlots, setSelectedMinionSlots] = useState([])
    const [finalMinions, setFinalMinions] = useState([])

    const handleStartFromHome = (action) => {
        if (action === "DUEL") {
            setCurrentScreen('mode-select')
        } else if (action === "RULES") {
            alert("Rules page is under construction!")
        }
    }

    const handleSelectMode = (mode) => {
        setGameMode(mode)
        setCurrentScreen('setup-types')
    }

    // เมื่อกดยืนยันในหน้าเลือกจำนวน (I, II, III...)
    const handleTypeSelectContinue = (typeString) => {
        setSelectedTypeCount(typeString) // เก็บจำนวนไว้
        setCurrentScreen('choose-minions') // 👈 พาไปหน้าเลือกรูปตัวละคร แทนการไปหน้า Strategy ตรงๆ
    }

    // เมื่อกดยืนยันในหน้าเลือกรูปตัวละคร
    const handleChooseMinionContinue = (minionObjects) => {
        // minionObjects หน้าตาจะประมาณ [{id: 1, label: "Palrose", imageUrl: "..."}, ...]
        setSelectedMinionSlots(minionObjects)
        setCurrentScreen('setup-strategy') // 👈 ส่งต่อไปหน้าพิมพ์โค้ด Strategy
    }

    const handleStrategyFinish = (completedDrafts) => {
        const roster = Object.values(completedDrafts)

        // ผสมข้อมูล Strategy เข้ากับข้อมูลรูปภาพเดิม
        const combinedRoster = roster.map((draft, index) => ({
            ...draft,
            imageUrl: selectedMinionSlots[index]?.imageUrl || "/minion-assassin.png"
        }))

        setFinalMinions(combinedRoster)
        setCurrentScreen('game')
    }

    return (
        <>
            {currentScreen === 'home' && (
                <Home onStart={handleStartFromHome} />
            )}

            {currentScreen === 'mode-select' && (
                <ModeSelectPage
                    onBack={() => setCurrentScreen('home')}
                    onSelectMode={handleSelectMode}
                />
            )}

            {currentScreen === 'setup-types' && (
                <MinionTypePage
                    gameMode={gameMode}
                    onBack={() => setCurrentScreen('mode-select')}
                    onConfirm={handleTypeSelectContinue}
                />
            )}

            {/* 👈 เพิ่มเงื่อนไขหน้าจอเลือกรูปภาพตัวละคร */}
            {currentScreen === 'choose-minions' && (
                <ChooseMinionPage
                    minionType={selectedTypeCount} // ส่ง I, II, III เข้าไปให้หน้านี้รู้ว่าเลือกได้กี่ตัว
                    gameMode={gameMode}
                    onBack={() => setCurrentScreen('setup-types')}
                    onContinue={handleChooseMinionContinue}
                />
            )}

            {currentScreen === 'setup-strategy' && (
                <MinionStrategyPage
                    selectedMinions={selectedMinionSlots} // ข้อมูลนี้จะเอาไปโชว์ในแท็บด้านข้างได้เลย
                    onBack={() => setCurrentScreen('choose-minions')} // 👈 ปุ่มกลับให้ไปหน้าเลือกรูปภาพ
                    onFinishAll={handleStrategyFinish}
                />
            )}

            {currentScreen === 'game' && (
                <GamePage
                    minionConfigs={finalMinions}
                    gameMode={gameMode}
                    onBack={() => setCurrentScreen('home')}
                />
            )}
        </>
    )
}