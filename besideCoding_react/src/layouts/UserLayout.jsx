// src/layouts/UserLayout.jsx
import React, { useState, useEffect, use } from "react";
import { Outlet, useLocation, useNavigate, useMatch } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProblemNavbar from "../components/ProblemNavbar";
import AssistantPanel from "../components/AssistantPanel";
import Swal from "sweetalert2";
import axios from "axios";
import useSessionUser from "../components/useSessionUser"; // Import the new hook

const UserLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const problemMatch = useMatch("/problem/:id");
  const routeProblemId = problemMatch ? Number(problemMatch.params.id) : NaN;
  const assistantProblemId = Number.isFinite(routeProblemId) ? routeProblemId : null;

  const hideNavbarRoutes = ["/", "/signin", "/signup"];
  const shouldHideNavbar = hideNavbarRoutes.includes(pathname);
  const isProblemDetailPage = /^\/problem\/[^/]+$/.test(pathname);

  

  const { user, loading } = useSessionUser(); // use the new hook
  const userId = user?.userId;

  useEffect(() => {
    if (!loading && !user && !hideNavbarRoutes.includes(pathname)) {
      Swal.fire({
        title: "Please Log In",
        text: "You must be logged in to access this page.",
        imageUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdzU2cml5ZmM2ZGNvNmR6bnloZTliNmNiaDZxYWJyaGF5MmN5aWZsMCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/kR7ZcmWilyVi0/giphy.gif",
        imageWidth: 100,
        imageHeight: 100,
        background: "#1e1e1e",
        color: "#fff",
        confirmButtonText: "Login",
        confirmButtonColor: "#22c55e",
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          popup: 'rounded-2xl shadow-xl',
          title: 'text-white text-lg font-bold',
          confirmButton: 'bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-2',
        },
        showClass: {
          popup: 'animate__animated animate__fadeInDown',
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/signin");
        }
      });
    }
  }, [loading, user, pathname, navigate]);

  if (loading) {
    return (
      <div className="text-white p-4 bg-[#1e1e1e] min-h-screen flex items-center justify-center">
        Loading session...
      </div>
    );
  }

  return (
    <div>
      {!shouldHideNavbar && (isProblemDetailPage ? <ProblemNavbar /> : <Navbar />)}
      {user || shouldHideNavbar ? <Outlet context={{ user }} /> : null}
      {user && !shouldHideNavbar && <AssistantPanel problemId={assistantProblemId} />}
    </div>
  );
};


export default UserLayout;
