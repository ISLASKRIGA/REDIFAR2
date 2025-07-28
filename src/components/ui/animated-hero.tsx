import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onLoginClick: () => void;
}

function Hero({ onLoginClick }: HeroProps) {
  const [titleNumber, setTitleNumber] = useState(0);

  const titles = useMemo(
    () => ["trazable","medible", "inteligente", "eficaz", "eficiente", "sustentable"],
    []
  );

  const coloresTailwind = [
    "text-red-500",
    "text-green-500",
    "text-yellow-500",
    "text-blue-500",
    "text-purple-500",
    "text-pink-500",
    "text-indigo-500",
    "text-emerald-500",
    "text-orange-500",
  ];

  // Asigna un color aleatorio único a cada palabra al inicio
  const titleColors = useMemo(() => {
    const shuffledColors = [...coloresTailwind];
    return titles.map(() => {
      const index = Math.floor(Math.random() * shuffledColors.length);
      return shuffledColors.splice(index, 1)[0] || "text-blue-500";
    });
  }, [titles]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev + 1) % titles.length);
    }, 2500);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles.length]);

  const handleLoginClick = () => {
    console.log("Login button clicked!");
    onLoginClick();
  };

  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Lee nuestro artículo <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
              <span className="text-black-600">La Red Hospitalaria es</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className={`absolute font-semibold ${titleColors[index]}`}
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
              Innovación Colaborativa para el Intercambio y Distribución Responsable de Medicamentos en el Sistema de Salud Mexicano.
            </p>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline">
              ¿Cómo Funciona? <PhoneCall className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              className="gap-4 bg-black text-white"
              onClick={handleLoginClick}
            >
              Inicia Sesión <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
