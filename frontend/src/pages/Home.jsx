import React from 'react'
import { motion } from "motion/react"
import { FaArrowRight } from "react-icons/fa6";
import LoginModel from '../components/LoginModel';
import { useState } from 'react';
import guardianShield from "../assets/brand/guardian-shield-transparent.png"
import guardianWordmark from "../assets/brand/guardian-wordmark-transparent.png"
import robotIllustration from "../assets/brand/guardian-interview-robot.png"
import { FiMic, FiFileText, FiBarChart2, FiMap } from "react-icons/fi";
function Home({ setUser }) {
    const [showLogin, setShowLogin] = useState(false)
    return (
        <div className='bg-white text-[#0A0A0A] font-sans min-h-screen overflow-x-hidden'>

            {/* navbar */}

            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className='fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-5 bg-white/70 backdrop-blur-xl border-b border-black/5'>

                <div className='flex items-center gap-2.5'>
                    <img src={guardianShield} alt="Guardian AI Logo" className='w-7 h-7 object-contain drop-shadow-sm' />
                    <div className='flex flex-col'>
                        <span className='font-extrabold text-base tracking-tight text-[#0A0A0A] leading-none'>Guardian AI</span>
                        <span className='text-[9px] uppercase tracking-wider font-semibold text-black/45 mt-0.5'>Interview Assistant</span>
                    </div>
                </div>

                <motion.button
                    onClick={() => setShowLogin(true)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className='bg-[#0A0A0A]/80 backdrop-blur-2xl text-white font-semibold border border-white/10 rounded-md px-3 py-1.5 text-xs cursor-pointer transition-all hover:border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center gap-2'>
                    Log In <FaArrowRight />

                </motion.button>

            </motion.nav>

            {/* main area */}
            <section className='relative pt-20 pb-14 overflow-hidden bg-[#F8F9FA]'>
                <div className='absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-black/[0.04] blur-[90px] pointer-events-none' />

                <div className='max-w-4xl mx-auto px-6 text-center'>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className='inline-flex items-center px-3 py-1.5 rounded-full border border-black/15 bg-black/5 text-black/70 text-xs font-medium mb-4'>
                        Multi-Agent Interview Platform

                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.12 }}
                        className='text-3xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-[#0A0A0A] [text-shadow:0_4px_24px_rgba(0,0,0,0.12)]'>
                        Job Interviews<br />
                        <span className="text-black/30">
                            Don't Have to Suck
                        </span><br />
                        Anymore!
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.2 }}
                        className='text-black/50 text-sm md:text-base leading-relaxed max-w-lg mx-auto mb-6 [text-shadow:0_2px_10px_rgba(0,0,0,0.06)]'>
                        Guardian AI is an AI-powered interview preparation platform that helps candidates practise interviews, improve their answers, analyse performance, and prepare for their careers.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.28 }}>

                        <motion.button
                            onClick={() => setShowLogin(true)}
                            whileHover={{ scale: 1.05, boxShadow: "0 0 36px rgba(0,0,0,0.18)" }}
                            whileTap={{ scale: 0.97 }}
                            className='relative gap-2 overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-2xl text-white font-bold px-5 py-2.5 rounded-lg text-xs cursor-pointer border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all hover:border-white/20'>
                            <span className='flex items-center justify-center gap-2'> Get Started For Free <FaArrowRight /></span>
                            <span className='absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none rounded-lg' />
                        </motion.button>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className='mt-10 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.14)] border border-black/10 max-w-4xl mx-auto bg-[#18191E]'>

                    <img
                        src={robotIllustration}
                        alt='Guardian AI robot helping candidates practise interviews'
                        className='w-full h-auto object-contain block'
                    />

                </motion.div>

            </section>

            {/* Agents */}
            <section className='py-16 bg-[#F8F9FA]'>
                <div className='max-w-5xl mx-auto px-6'>
                    <div className='text-center mb-10'>
                        <div className='inline-flex items-center px-3 py-1.5 rounded-full border border-black/15 bg-black/5 text-black/70 text-xs font-medium mb-4'>
                            AI Powered Agents
                        </div>

                        <h2 className='text-2xl md:text-4xl font-extrabold tracking-tight text-[#0A0A0A] [text-shadow:0_4px_20px_rgba(0,0,0,0.1)]'>
                            Specialized Agents For
                            <span className="block text-black/30">
                                Every Interview Stage
                            </span>
                        </h2>

                        <p className='text-black/40 text-sm max-w-2xl mx-auto mt-4 leading-relaxed'>
                            Guardian AI combines multiple AI agents that work together
                            to help you build your resume, practice interviews,
                            receive detailed feedback, and follow a personalized roadmap
                            to land your dream job.
                        </p>
                    </div>
                    <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                        {
                            [
                                {
                                    icon: <FiFileText />,
                                    title: "Resume Agent",
                                    desc: "Create ATS-friendly resumes, improve profile strength and maximize interview opportunities.",
                                },
                                {
                                    icon: <FiMic />,
                                    title: "Interview Agent",
                                    desc: "Conduct realistic HR, Technical and Coding interviews with AI-powered simulations.",
                                },
                                {
                                    icon: <FiBarChart2 />,
                                    title: "Feedback Agent",
                                    desc: "Get detailed answer analysis, scoring reports and improvement recommendations.",
                                },
                                {
                                    icon: <FiMap />,
                                    title: "Roadmap Agent",
                                    desc: "Generate personalized learning roadmaps based on goals, skills and performance.",
                                },
                            ].map((agent, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.45, delay: i * 0.08 }}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className='group relative overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:border-white/20 transition-all'>
                                        <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none'/>

                                        <div className='absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'/>

                                        <div className='relative'>
                                            <div className='w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white text-lg mb-4 shadow-inner'>{agent.icon}</div>

                                            <h2 className='text-base font-bold mb-2 text-white'>{agent.title}</h2>

                                            <p className='text-white/45 text-xs leading-relaxed'>{agent.desc}</p>
                                        </div>

                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            </section>

            {showLogin && <LoginModel onClose={() => setShowLogin(false)} setUser={setUser} />}

            <footer className='border-t border-black/8 py-8 text-center bg-white'>
                <div className='flex items-center justify-center mb-3'>
                    <img
                        src={guardianWordmark}
                        alt="Guardian AI – Interview Assistant"
                        className='h-9 w-auto object-contain max-w-[240px]'
                    />
                </div>
                <div className='text-black/50 text-xs'>
                    © {new Date().getFullYear()} Guardian AI · Interview Assistant. All rights reserved.
                </div>
            </footer>


        </div>
    )
}

export default Home
