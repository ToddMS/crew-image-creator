interface CornerBorderProps {
  className?: string
}

export function CornerBorder({ className = '' }: CornerBorderProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Background */}
      <div className="absolute inset-0 bg-white border-[5px] border-black" />

      {/* Corner decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-left corner - Pink */}
        <div className="absolute top-2 left-2 w-16 h-16">
          <div className="w-full h-3 bg-pink-300"></div>
          <div className="w-3 h-full bg-pink-300 absolute top-0 left-0"></div>
        </div>

        {/* Top-right corner - Green */}
        <div className="absolute top-2 right-2 w-16 h-16">
          <div className="w-full h-3 bg-green-700"></div>
          <div className="w-3 h-full bg-green-700 absolute top-0 right-0"></div>
        </div>

        {/* Bottom-left corner - Green */}
        <div className="absolute bottom-2 left-2 w-16 h-16">
          <div className="w-full h-3 bg-green-700 absolute bottom-0"></div>
          <div className="w-3 h-full bg-green-700 absolute bottom-0 left-0"></div>
        </div>

        {/* Bottom-right corner - Pink */}
        <div className="absolute bottom-2 right-2 w-16 h-16">
          <div className="w-full h-3 bg-pink-300 absolute bottom-0"></div>
          <div className="w-3 h-full bg-pink-300 absolute bottom-0 right-0"></div>
        </div>
      </div>
    </div>
  )
}
