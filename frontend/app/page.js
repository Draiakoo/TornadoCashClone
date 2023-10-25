"use client"

import InteractionWindow from "@/components/InteractionWindow.jsx";
import Navbar from "@/components/Navbar";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {

  return (
    <div className="bg-white h-full min-h-screen pb-20">
      <ToastContainer />
      <Navbar />
      <InteractionWindow />
    </div>
  )
}
