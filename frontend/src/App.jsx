import { useState } from 'react'
import MinionTypePage from './pages/MinionTypePage'
import MinionStrategyPage from './pages/MinionStrategyPage'
import GamePage from './pages/GamePage'

export default function App() {
    // ควบคุมว่าปัจจุบันอยู่หน้าไหน: 'setup-types', 'setup-strategy', 'game'
    const [currentScreen, setCurrentScreen] = useState('setup-types')

    // เก็บจำนวนช่อง Minion ที่ผู้เล่นเลือก เช่น ถ้าเลือก "III" ก็จะมี 3 ช่อง
    const [selectedMinionSlots, setSelectedMinionSlots] = useState([])
    const [finalMinions, setFinalMinions] = useState([]) // สำหรับส่งไปหน้า GamePage

    // เมื่อผู้เล่นกดปุ่ม CONTINUE ในหน้า MinionTypePage
    const handleTypeSelectContinue = (typeString) => {
        // แปลงอักษรโรมันเป็นตัวเลข
        const mapping = { "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5 }
        const count = mapping[typeString] || 1

        // สร้าง Array ช่องว่างๆ ตามจำนวนที่เลือก เพื่อส่งไปให้หน้า Strategy สร้างแท็บ
        const slots = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            label: `Type ${i + 1}`
        }))

        setSelectedMinionSlots(slots)
        setCurrentScreen('setup-strategy')
    }

    // เมื่อผู้เล่นกรอกโค้ดเสร็จและกด FINISH ในหน้า MinionStrategyPage (API ยิงผ่านแล้ว)
    const handleStrategyFinish = (completedDrafts) => {
        // แปลง object drafts ให้กลายเป็น array เพื่อส่งไปแสดงเป็น Inventory ใน GamePage
        const roster = Object.values(completedDrafts)
        setFinalMinions(roster)
        setCurrentScreen('game')
    }

    return (
        <>
            {currentScreen === 'setup-types' && (
                <MinionTypePage
                    onBack={() => console.log('Back to main menu')}
                    onConfirm={handleTypeSelectContinue}
                />
            )}

            {currentScreen === 'setup-strategy' && (
                <MinionStrategyPage
                    selectedMinions={selectedMinionSlots}
                    onBack={() => setCurrentScreen('setup-types')}
                    onFinishAll={handleStrategyFinish}
                />
            )}

            {currentScreen === 'game' && (
                <GamePage
                    minionConfigs={finalMinions}
                    onBack={() => setCurrentScreen('setup-types')}
                />
            )}
        </>
    )
}