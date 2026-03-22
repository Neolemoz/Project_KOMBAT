import { useMemo, useState, useEffect } from "react"
import { hexPointsPointyTop, hexToPixelPointyTop } from "../utils/hexMath"

export default function BoardSVG({
                                     rows = 8,
                                     cols = 8,
                                     selected,
                                     spawnZone,
                                     activePlayer,
                                     boardState,
                                     purchasableHexes,
                                     onHexClick,
                                     size = 55,
                                     padding = 60,
                                     className = "",
                                 }) {

    const spawnFill = activePlayer === 1
        ? "rgba(251,113,133,0.4)"
        : "rgba(125,211,252,0.4)"

    const [hover, setHover] = useState(null)

    const [blink,setBlink] = useState(true)

    useEffect(()=>{

        const id = setInterval(()=>{
            setBlink(v=>!v)
        },700)

        return ()=>clearInterval(id)

    },[])

    const hexes = useMemo(()=>{

        const items=[]

        for(let r=1;r<=rows;r++){
            for(let c=1;c<=cols;c++){

                const {x,y}=hexToPixelPointyTop(r,c,size)

                items.push({
                    row:r,
                    col:c,
                    x:x+padding,
                    y:y+padding
                })
            }
        }

        return items

    },[rows,cols,size,padding])

    const bounds = useMemo(()=>{

        if(hexes.length===0)
            return {w:0,h:0,minX:0,minY:0}

        let minX=Infinity
        let maxX=-Infinity
        let minY=Infinity
        let maxY=-Infinity

        for(const h of hexes){

            minX=Math.min(minX,h.x-size)
            maxX=Math.max(maxX,h.x+size)

            minY=Math.min(minY,h.y-size)
            maxY=Math.max(maxY,h.y+size)
        }

        const margin=20

        return {
            w:(maxX-minX)+margin*2,
            h:(maxY-minY)+margin*2,
            minX:minX-margin,
            minY:minY-margin
        }

    },[hexes,size])

    return(

        <div className={`relative ${className} flex items-center justify-center`}>

            <svg
                width="100%"
                height="100%"
                viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`}
                preserveAspectRatio="xMidYMid meet"
                className="select-none max-h-[85vh]"
            >

                {hexes.map(h=>{

                    const key=`${h.row},${h.col}`

                    const isSpawn=spawnZone?.has(key)

                    const isSelected=
                        selected?.row===h.row &&
                        selected?.col===h.col

                    const isHovered=
                        hover?.row===h.row &&
                        hover?.col===h.col

                    const isPurchasable=
                        purchasableHexes?.has(key)

                    const hexData=
                        boardState?.get(key)||{}

                    const owner=Number(hexData.owner)
                    const hasMinion=hexData.hasMinion

                    let fill="rgba(20,25,35,0.7)"

                    if(owner===1)
                        fill="rgba(244,63,94,0.5)"

                    if(owner===2)
                        fill="rgba(14,165,233,0.5)"

                    if(isSpawn && !owner)
                        fill=spawnFill

                    if(isPurchasable && !owner){

                        fill=blink
                            ? "rgba(251,191,36,0.55)"
                            : "rgba(251,191,36,0.15)"
                    }

                    let stroke="rgba(100,116,139,0.5)"
                    let strokeWidth=1

                    if(isPurchasable && !owner){

                        stroke=blink
                            ? "rgba(251,191,36,0.9)"
                            : "rgba(251,191,36,0.3)"

                        strokeWidth=2
                    }

                    if(isHovered){
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth=2
                    }

                    if(isSelected){
                        stroke="rgba(255,215,0,1)"
                        strokeWidth=3
                    }

                    const pts=hexPointsPointyTop(h.x,h.y,size)

                    return(

                        <g key={key}>

                            <polygon
                                points={pts}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={strokeWidth}
                                style={{cursor:"pointer"}}
                                onMouseEnter={()=>setHover({row:h.row,col:h.col})}
                                onMouseLeave={()=>setHover(null)}
                                onClick={()=>onHexClick?.(h.row,h.col)}
                            />

                            <text
                                x={h.x}
                                y={h.y-size*0.4}
                                textAnchor="middle"
                                fontSize="10"
                                fill="rgba(255,255,255,0.3)"
                                style={{pointerEvents:"none"}}
                            >
                                {h.row},{h.col}
                            </text>

                            {isPurchasable && !owner &&(

                                <text
                                    x={h.x}
                                    y={h.y+5}
                                    textAnchor="middle"
                                    fontSize="14"
                                >
                                    💰
                                </text>
                            )}

                            {hasMinion &&(

                                <g>

                                    <circle
                                        cx={h.x}
                                        cy={h.y+2}
                                        r={size*0.40}
                                        fill={owner===1 ? "#f43f5e":"#0ea5e9"}
                                        stroke="#fff"
                                        strokeWidth="2"
                                    />

                                    <text
                                        x={h.x}
                                        y={h.y+6}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fill="#fff"
                                        fontWeight="bold"
                                    >
                                        M
                                    </text>

                                    <rect
                                        x={h.x-14}
                                        y={h.y+size*0.40+4}
                                        width="28"
                                        height="12"
                                        fill="rgba(0,0,0,0.7)"
                                        rx="4"
                                    />

                                    <text
                                        x={h.x}
                                        y={h.y+size*0.40+13}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fill="#4ade80"
                                        fontWeight="bold"
                                    >
                                        {hexData.hp}
                                    </text>

                                </g>
                            )}

                        </g>
                    )

                })}

            </svg>

        </div>

    )
}