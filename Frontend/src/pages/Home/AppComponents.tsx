import { motion, useInView } from "framer-motion"
import { BookOpen, Brain, BrainCircuit, Calendar, CheckCircle, Clock, Code, Combine, Mail, Timer, Zap } from 'lucide-react'
import { Card } from "@/components/Common/shadcnui/card"
import { BackgroundGradient } from "@/components/Common/shadcnui/background-gradient"
import React, { useRef } from "react"
import { cn } from "@/lib/utils.ts";

export default function AppComponents() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const connections = [
    {
      start: { x: 380, y: 100 },
      end: { x: 380, y: 250 },
      delay: 0.2,
      color: 'stroke-red-500'
    },
    {
      start: { x: 520, y: 100 },
      end: { x: 520, y: 250 },
      delay: 0.4,
      color: 'stroke-blue-500'
    },
    // Side Services
    {
      start: { x: 100, y: 270 },
      end: { x: 380, y: 270 },
      delay: 0.6,
      color: 'stroke-green-500'
    },
    {
      start: { x: 100, y: 335 },
      end: { x: 380, y: 335 },
      delay: 0.8,
      color: 'stroke-yellow-500'
    },
    // Bottom Services
    {
      start: { x: 380, y: 460 },
      end: { x: 380, y: 350 },
      delay: 1,
      color: 'stroke-blue-500'
    },
    {
      start: { x: 520, y: 460 },
      end: { x: 520, y: 350 },
      delay: 1.2,
      color: 'stroke-purple-500'
    },
    {
      start: { x: 520, y: 300 },
      end: { x: 765, y: 300 },
      delay: 1.5,
      color: 'stroke-orange-500'
    }
  ]

  const pathVariants: any = {
    hidden: {
      pathLength: 0,
      opacity: 0
    },
    visible: (delay: any) => ({
      pathLength: 1,
      opacity: [0, 1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        delay: delay,
        times: [0, 0.5, 1],
        ease: "easeInOut"
      }
    })
  }

  const topServices = [
    {
      icon: <Brain className="w-5 h-5 text-red-500" />,
      name: "AI Interview",
      position: { top: '15%', left: '30%' },
      bgColor: 'bg-red-100'
    },
    {
      icon: <Code className="w-5 h-5 text-blue-500" />,
      name: "AI Quizzes",
      position: { top: '15%', right: '39%' },
      bgColor: 'bg-blue-100'
    }
  ]

  const sideServices = [
    {
      icon: <Calendar className="w-5 h-5 text-green-500" />,
      name: "Resume ATS Review",
      position: { top: '40%', left: '2%' },
      bgColor: 'bg-green-100'
    },
    {
      icon: <BookOpen className="w-5 h-5 text-yellow-500" />,
      name: "Learning Paths",
      position: { top: '52%', left: '5%' },
      bgColor: 'bg-yellow-100'
    }
  ]

  const bottomServices = [
    {
      icon: <Timer className="w-5 h-5 text-blue-500" />,
      name: "Job Updates",
      position: { bottom: '15%', left: '29%' },
      bgColor: 'bg-blue-100'
    },
    {
      icon: <Mail className="w-5 h-5 text-purple-500" />,
      name: "Email Alerts",
      position: { bottom: '15%', right: '39%' },
      bgColor: 'bg-purple-100'
    }
  ]

  const workflows = [
    {
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      title: "Domain Setup",
      subtitle: "Choose your path",
      steps: ["Step 1", "Step 2"],
      bgColor: 'bg-blue-50'
    },
    {
      icon: <Calendar className="w-6 h-6 text-green-500" />,
      title: "Schedule",
      subtitle: "Plan interview",
      steps: ["Step 1", "Step 2"],
      bgColor: 'bg-green-50'
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Insights",
      subtitle: "Track performance",
      steps: ["Step 1", "Step 2"],
      bgColor: 'bg-yellow-50'
    }
  ]

  return (
    <div className="font-manrope">
      <div ref={ref} >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <section className="text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 font-medium mb-4">
              <Combine className="w-5 h-5" />
              <span>Career Paths</span>
            </div>
            <h2 className={cn(
              "text-3xl md:text-4xl font-bold mb-4",
              "bg-clip-text text-transparent",
              "bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900",
              "drop-shadow-sm"
            )}>
              Connect your favourite apps in one place
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our portal acts as a central hub for your work, seamlessly
              communicating between your favorite apps and giving actionable insights
            </p>
          </section>
        </motion.div>

        <div className="bg-gradient-to-b from-white via-[rgba(94,144,224,0.15)] to-white">
          <div className="relative max-w-5xl mx-auto h-[600px]">
            <div className="relative w-full h-full">
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                {connections.map((connection, index) => (
                  <motion.path
                    key={index}
                    d={`M ${connection.start.x},${connection.start.y} L ${connection.end.x},${connection.end.y}`}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                    custom={connection.delay}
                    variants={pathVariants}
                    className={`stroke-2  ${connection.color}`}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                ))}
              </svg>
            </div>

            {/* Central Hub */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isInView ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="absolute left-80 top-56 -translate-x-1/2 -translate-y-1/2 z-10"
            >
              {/* <BackgroundGradient> */}
                <Card
                  className="w-64 h-40 flex border-4  items-center rounded-2xl justify-center shadow-lg border-blue-300">
                  <div className="text-center">
                    <div
                      className="w-16 h-16  rounded-full flex items-center justify-center mx-auto mb-2">
                      <BrainCircuit className="text-green-400" size={40} />
                    </div>
                    <h3 className="font-bold text-2xl">{import.meta.env.VITE_SITE_NAME}</h3>
                  </div>
                </Card>
              {/* </BackgroundGradient> */}
            </motion.div>

            {/* Service Cards */}
            {[...topServices, ...sideServices, ...bottomServices].map((service, index) => (
              <motion.div
                key={index}
                className="absolute z-20"
                style={service.position}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <Card
                  className={`flex items-center gap-3 px-4 py-3 bg-white shadow-sm hover:shadow-md transition-shadow ${service.bgColor} border-0`}
                >
                  <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center ${service.name === "Learning Paths" ? 'w-10 h-10' : ''}`}>
                    {service.icon}
                  </div>
                  <span className="text-sm font-semibold">{service.name}</span>
                </Card>
              </motion.div>
            ))}


            {/* Workflow Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -right-16 top-1 -translate-y-1/2 bg-white rounded-xl shadow-md p-6 w-80"
            >
              <div className="space-y-8">
                {workflows.map((workflow, index) => (
                  <div key={index} className="space-y-4">
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${workflow.bgColor}`}>
                      <div
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        {workflow.icon}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{workflow.title}</h3>
                        <p className="text-xs text-gray-500">{workflow.subtitle}</p>
                      </div>
                    </div>
                    <div className="space-y-3 pl-4">
                      {workflow.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                          <div className="flex-1">
                            <div className="h-8 bg-gray-100 rounded-md w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

