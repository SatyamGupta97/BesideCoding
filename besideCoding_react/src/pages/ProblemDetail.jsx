import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from '../Constants';

// --- SVG Icons ---
const DocumentTextIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
);
const CodeBracketIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
);
const CheckCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" /></svg>
);
const TopicsIconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
);
const CompaniesIconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-yellow-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
);
// HintIconTag (if used, not present in the original usage)
// const HintIconTag = () => ( /* ... */ );
const TopicsSectionIcon = () => (
  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8a9 9 0 100-18 9 9 0 000 18z" /></svg>
);
const CompaniesSectionIcon = () => (
  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0-1.38-1.12-2.5-2.5-2.5S7 9.62 7 11v2h10v-2c0-1.38-1.12-2.5-2.5-2.5S12 9.62 12 11z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13h14v7H5z" /></svg>
);

// New Like/Dislike Icons
const LikeOutlineIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 0 0-6 0v4H5.5A1.5 1.5 0 0 0 4 10.5v2.25a1.5 1.5 0 0 0 1.5 1.5H8v6.25a1.25 1.25 0 0 0 2.5 0V14h3.25a2.25 2.25 0 0 0 2.25-2.25V11a2 2 0 0 0-2-2h-1z" />
  </svg>
);
const LikeSolidIcon = ({ className = "w-5 h-5 text-blue-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M14 9V5a3 3 0 0 0-6 0v4H5.5A1.5 1.5 0 0 0 4 10.5v2.25a1.5 1.5 0 0 0 1.5 1.5H8v6.25a1.25 1.25 0 0 0 2.5 0V14h3.25a2.25 2.25 0 0 0 2.25-2.25V11a2 2 0 0 0-2-2h-1z" />
  </svg>
);
const DislikeOutlineIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15v4a3 3 0 0 0 6 0v-4h3.5a1.5 1.5 0 0 0 1.5-1.5v-2.25a1.5 1.5 0 0 0-1.5-1.5H16V4.25a1.25 1.25 0 0 0-2.5 0V10h-3.25A2.25 2.25 0 0 0 8 12.25v.75a2 2 0 0 0 2 2h1z" />
  </svg>
);
const DislikeSolidIcon = ({ className = "w-5 h-5 text-red-500" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M10 15v4a3 3 0 0 0 6 0v-4h3.5a1.5 1.5 0 0 0 1.5-1.5v-2.25a1.5 1.5 0 0 0-1.5-1.5H16V4.25a1.25 1.25 0 0 0-2.5 0V10h-3.25A2.25 2.25 0 0 0 8 12.25v.75a2 2 0 0 0 2 2h1z" />
  </svg>
);

// Helper to format counts (e.g., 1200 -> 1.2K)
const formatCount = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
};

const ProblemDetail = () => {
  const { id: problemRouteId } = useParams();
  const [problem, setProblem] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [showTopics, setShowTopics] = useState(true);
  const [showCompanies, setShowCompanies] = useState(false);
  const [isSolved, setIsSolved] = useState(false); 

  // The written solution is fetched on demand because the API hides it during a live contest.
  const [solution, setSolution] = useState(null);
  const [solutionError, setSolutionError] = useState("");
  const [solutionLoading, setSolutionLoading] = useState(false);


  const [userLikeStatus, setUserLikeStatus] = useState(null); 
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);

  const leftPanelRef = useRef(null);
  const topicsSectionRef = useRef(null);
  const companiesSectionRef = useRef(null);

  const useSessionUserId = () => {
    const [userId, setUserId] = useState(null);
    useEffect(() => {
      axios.get(API_BASE_URL + "api/session-user", { withCredentials: true })
        .then(res => setUserId(res.data.userId))
        .catch(err => {
          console.error("Not logged in or error fetching session user:", err);
          setUserId(null);
        });
    }, []);
    return userId;
  };
  const userId = useSessionUserId();

  useEffect(() => {
    if (problemRouteId) {
      setSolution(null);
      setSolutionError("");
      axios.get(`${API_BASE_URL}api/problems/${problemRouteId}`)
        .then((res) => {
          setProblem(res.data);

        })
        .catch((err) => {
            console.error("Error fetching problem:", err);
            setProblem(null); 
            toast.error("Failed to load problem details.", { position: "top-center" });
        });
    }
  }, [problemRouteId]);

  const loadSolution = () => {
    if (solution !== null || solutionLoading) return;
    setSolutionLoading(true);
    setSolutionError("");
    axios.get(`${API_BASE_URL}api/problems/${problemRouteId}/solution`, { withCredentials: true })
      .then((res) => setSolution(res.data?.solution ?? ""))
      .catch((err) => {
        setSolutionError(
          err?.response?.data?.message || "Could not load the solution right now."
        );
      })
      .finally(() => setSolutionLoading(false));
  };

  // Fetch initial like/dislike status and counts
  useEffect(() => {
    if (problemRouteId && userId) { // Ensure userId is available
      axios.get(`${API_BASE_URL}api/problems/${problemRouteId}/interactions`, {
        params: { userId },
        withCredentials: true
      })
      .then(response => {
        const { userStatus, likes, dislikes } = response.data;
        setUserLikeStatus(userStatus);
        setLikeCount(likes || 0);
        setDislikeCount(dislikes || 0);
      })
      .catch(error => {
        console.error("Error fetching like/dislike status:", error);
        // Don't necessarily show a toast here, as it might be too noisy on load
        // But reset states to default
        setUserLikeStatus(null);
        setLikeCount(0);
        setDislikeCount(0);
      });
    } else if (problemRouteId && !userId) {
        // If problemId exists but no userId, fetch public like/dislike counts
        axios.get(`${API_BASE_URL}api/problems/${problemRouteId}/interactions`, {
            withCredentials: true // Might not be needed if endpoint allows non-authed count fetching
        })
        .then(response => {
            const { likes, dislikes } = response.data; // Assuming it returns counts even without userId
            setLikeCount(likes || 0);
            setDislikeCount(dislikes || 0);
            setUserLikeStatus(null); // No user, so no specific status
        })
        .catch(error => {
            console.error("Error fetching public interaction counts:", error);
            setLikeCount(0);
            setDislikeCount(0);
        });
    }
  }, [problemRouteId, userId]);


  const handleInteraction = async (clickedInteractionType) => { // 'LIKE' or 'DISLIKE'
    if (!userId) {
      toast.error("You must be logged in to interact.", { position: "top-center", autoClose: 2000 });
      return;
    }
    if (!problem) { // Or problemRouteId
        toast.error("Problem data not loaded yet.", { position: "top-center", autoClose: 2000 });
        return;
    }

    const localPreviousUserLikeStatus = userLikeStatus;

    let statusToSendToApi;
    if (userLikeStatus === clickedInteractionType) {
      statusToSendToApi = null; // Toggle off
    } else {
      statusToSendToApi = clickedInteractionType; // Set to new status
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}api/problems/${problemRouteId}/interact`,
        {
          userId: userId,
          status: statusToSendToApi,
        },
        { withCredentials: true }
      );

      setLikeCount(res.data.likes);
      setDislikeCount(res.data.dislikes);
      setUserLikeStatus(res.data.userStatus); // Source of truth for current status

      if (res.data.userStatus === 'LIKE') {
          toast.success("Problem Liked!", { position: "top-center", autoClose: 1500 });
      } else if (res.data.userStatus === 'DISLIKE') {
          toast.info("Problem Disliked.", { position: "top-center", autoClose: 1500 });
      } else if (res.data.userStatus === null) { // Interaction removed
          if (localPreviousUserLikeStatus === 'LIKE') {
            toast.info("Like removed.", { position: "top-center", autoClose: 1500 });
          } else if (localPreviousUserLikeStatus === 'DISLIKE') {
            toast.info("Dislike removed.", { position: "top-center", autoClose: 1500 });
          }
      }
    } catch (err) {
      console.error("Error updating interaction", err);
      toast.error("Something went wrong with the interaction.", { position: "top-center"});
      // Optionally revert UI optimistic updates if implemented
    }
  };


  const handleSubmit = async () => {
    if (!problem || !userId) {
        toast.error("Cannot submit: problem or user data missing.", { position: "top-center" });
        return;
    }
    const answer = problem.problemType === "MCQ" ? selectedOption : userAnswer;
    if (!answer || (typeof answer === 'string' && !answer.trim())) {
      toast.error("Please enter or select an answer", { position: "top-center" });
      return;
    }
    try {
      const res = await axios.post(API_BASE_URL + "api/submit", // Using axios for consistency
        {
          problemId: problem.id,
          userId: userId,
          answer: answer
        },
        { withCredentials: true }
      );
      
      if (res.data && res.data.status === "solved") {
        toast.success("✅ Correct Answer!", { position: "top-center" });
        setIsSolved(true);
      } else if (res.data && res.data.status === "failed") {
        toast.error("❌ Wrong Answer", { position: "top-center" });
        setIsSolved(false); // Explicitly set to false on wrong answer
      } else {
        toast.error(res.data.message || "Submission status unclear.", { position: "top-center" });
      }
    } catch (err) {
      console.error("Submission failed error:", err);
      const errorMessage = err.response?.data?.message || "Submission failed due to an error.";
      toast.error(errorMessage, { position: "top-center" });
    }
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleMouseDown = (e) => {
    if (!leftPanelRef.current) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelRef.current.offsetWidth;
    const handleMouseMove = (mouseMoveEvent) => {
      if (!leftPanelRef.current || !leftPanelRef.current.parentElement) return;
      const deltaX = mouseMoveEvent.clientX - startX;
      let newWidth = startWidth + deltaX;
      const parent = leftPanelRef.current.parentElement;
      const containerWidth = parent.offsetWidth;
      const sliderAndGapWidth = 8 + 8; // width of slider + gap
      const minPanelWidthPercentage = 0.20; // 20%
      const minAbsWidthForLeft = containerWidth * minPanelWidthPercentage;
      const minAbsWidthForRight = containerWidth * minPanelWidthPercentage;
      const maxAbsWidthForLeft = containerWidth - sliderAndGapWidth - minAbsWidthForRight;
      newWidth = Math.max(minAbsWidthForLeft, Math.min(newWidth, maxAbsWidthForLeft));
      leftPanelRef.current.style.width = `${newWidth}px`;
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (!problem) return <div className="text-white p-4 bg-[#1e1e1e] min-h-screen flex items-center justify-center">Loading problem details...</div>;

  const additionalInfo = problem.additionalInfo ? JSON.parse(problem.additionalInfo) : {};
  const isMCQ = problem.problemType === "MCQ";
  const companies = problem.company ? problem.company.split(",").map(c => c.trim()).filter(Boolean) : [];
  const subCategories = problem.subCategory ? problem.subCategory.split(",").map(s => s.trim()).filter(Boolean) : [];

  const tabButtonBaseClass = "flex items-center gap-2 px-3 py-2 text-xs font-medium rounded focus:outline-none transition-all duration-150 group";
  const getTabButtonOverallClasses = (tabName) => activeTab === tabName ? "text-white bg-[#373737]" : "text-gray-400 hover:text-white hover:bg-[#373737]";
  const getTabIconClasses = (tabName) => activeTab === tabName ? "text-sky-400" : "text-sky-400 group-hover:text-white transition-colors duration-150";
  const sectionHeaderBaseClass = "flex items-center gap-2 text-sm";
  const sectionChevronBaseClass = "w-4 h-4 transform transition-transform text-gray-300";

  return (
    <div className="h-[calc(100vh-50px)] bg-[#1e1e1e] text-white overflow-hidden p-2 box-border">
      <div className="flex flex-row h-full w-full gap-2">
        <div
          ref={leftPanelRef}
          className="h-full rounded-lg border border-neutral-700 bg-[#1e1e1e] flex flex-col overflow-hidden flex-shrink-0"
          style={{ width: '60%' }} // Initial width
        >
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#2d2d2d] border-b border-neutral-700 shrink-0 rounded-t-lg">
            <button className={`${tabButtonBaseClass} ${getTabButtonOverallClasses("description")}`} onClick={() => setActiveTab("description")}>
              <DocumentTextIcon className={`w-4 h-4 ${getTabIconClasses("description")}`} /> Description
            </button>
            <button className={`${tabButtonBaseClass} ${getTabButtonOverallClasses("solution")}`} onClick={() => { setActiveTab("solution"); loadSolution(); }}>
              <CodeBracketIcon className={`w-4 h-4 ${getTabIconClasses("solution")}`} /> Solution
            </button>
          </div>

          <div className="flex-grow overflow-y-auto">
            {activeTab === "description" && (
              <div className="p-4 space-y-7">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">{problem.id}. {problem.title}</h1>
                    {isSolved && userId && ( // Show solved status only if user is logged in
                      <div className="flex items-center gap-1 text-sm text-green-400">
                        <CheckCircleIcon className="w-5 h-5" /> Solved
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${problem.difficulty === "Easy" ? "bg-emerald-600/20 text-emerald-400" : problem.difficulty === "Medium" ? "bg-yellow-600/20 text-yellow-400" : problem.difficulty === "Hard" ? "bg-red-600/20 text-red-400" : "bg-gray-700/50 text-gray-300"}`}> {problem.difficulty} </span>
                    {subCategories.length > 0 && (<button onClick={() => { setShowTopics(true); scrollToSection(topicsSectionRef); }} className="flex items-center gap-1 bg-[#373737] text-gray-300 text-xs px-2 py-1 rounded-full hover:bg-[#4a4a4a] transition-colors"><TopicsIconTag /> Topics </button>)}
                    {companies.length > 0 && (<button onClick={() => { setShowCompanies(true); scrollToSection(companiesSectionRef); }} className="flex items-center gap-1 bg-[#373737] text-yellow-500 text-xs px-2 py-1 rounded-full hover:bg-[#4a4a4a] transition-colors"><CompaniesIconTag /> Companies </button>)}
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-300 border border-neutral-600 bg-[#252526] rounded p-4 leading-relaxed">
                  {problem.description}
                </pre>
                {subCategories.length > 0 && (<div ref={topicsSectionRef} id="topics-section">
                  <div className="flex items-center justify-between cursor-pointer pb-2" onClick={() => setShowTopics(!showTopics)}>
                    <div className={`${sectionHeaderBaseClass} text-gray-300`}> <TopicsSectionIcon /> <span>Topics</span> </div>
                    <svg className={`${sectionChevronBaseClass} ${showTopics ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {showTopics && (<div className="flex flex-wrap gap-2 pt-1"> {subCategories.map((sub, idx) => (<span key={idx} className="bg-[#373737] text-gray-300 text-xs px-2.5 py-1 rounded-full"> {sub} </span>))} </div>)}
                </div>)}
                {companies.length > 0 && (<div ref={companiesSectionRef} id="companies-section" className="border-t border-neutral-700 pt-7">
                  <div className="flex items-center justify-between cursor-pointer pb-2" onClick={() => setShowCompanies(!showCompanies)}>
                    <div className={`${sectionHeaderBaseClass} text-yellow-500`}> <CompaniesSectionIcon /> Companies </div>
                    <svg className={`${sectionChevronBaseClass} ${showCompanies ? "rotate-180" : ""} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {showCompanies && (<div className="flex flex-wrap gap-2 pt-1"> {companies.map((c, idx) => (<span key={idx} className="bg-[#373737] text-yellow-500 text-xs px-2.5 py-1 rounded-full"> {c} </span>))} </div>)}
                </div>)}
              </div>
            )}
            {activeTab === "solution" && (
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-3">Solution</h2>
                {solutionLoading ? (
                  <p className="text-gray-400">Loading solution...</p>
                ) : solutionError ? (
                  <p className="text-red-300">{solutionError}</p>
                ) : solution ? (
                  <pre className="whitespace-pre-wrap text-sm border border-neutral-600 bg-[#252526] rounded p-4 leading-relaxed">
                    {solution}
                  </pre>
                ) : (<p className="text-gray-400">Solution not available yet.</p>)}
              </div>
            )}
          </div>
          
          {activeTab === "description" && problem && (
            <div className="flex items-center justify-start gap-1 px-4 py-2 border-t border-neutral-700 shrink-0">
              <button
                onClick={() => handleInteraction('LIKE')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-600"
                aria-label="Like problem"
                aria-pressed={userLikeStatus === 'LIKE'}
              >
                {userLikeStatus === 'LIKE' ? (
                  <LikeSolidIcon className="w-4 h-4 text-blue-500" />
                ) : (
                  <LikeOutlineIcon className="w-4 h-4" />
                )}
                <span className={userLikeStatus === 'LIKE' ? 'text-white font-medium' : 'text-gray-400'}>{formatCount(likeCount)}</span>
              </button>
              <button
                onClick={() => handleInteraction('DISLIKE')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors p-1.5 rounded hover:bg-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-600"
                aria-label="Dislike problem"
                aria-pressed={userLikeStatus === 'DISLIKE'}
              >
                {userLikeStatus === 'DISLIKE' ? (
                  <DislikeSolidIcon className="w-4 h-4 text-red-500" />
                ) : (
                  <DislikeOutlineIcon className="w-4 h-4" />
                )}
                <span className={userLikeStatus === 'DISLIKE' ? 'text-white font-medium' : 'text-gray-400'}>{formatCount(dislikeCount)}</span>
              </button>
            </div>
          )}
        </div>

        <div
          className="w-2 h-full flex-shrink-0 rounded-lg cursor-col-resize flex items-center justify-center group bg-neutral-800 hover:bg-blue-600 active:bg-blue-700 transition-colors duration-150"
          onMouseDown={handleMouseDown}
        >
          <div className="flex flex-col space-y-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <div className="w-0.5 h-1.5 bg-neutral-500 rounded-full group-hover:bg-white"></div>
            <div className="w-0.5 h-1.5 bg-neutral-500 rounded-full group-hover:bg-white"></div>
            <div className="w-0.5 h-1.5 bg-neutral-500 rounded-full group-hover:bg-white"></div>
          </div>
        </div>

        <div className="h-full rounded-lg border border-neutral-700 bg-[#1e1e1e] flex flex-col overflow-hidden flex-1">
          <div className="p-6 flex flex-col flex-grow h-full">
            <div className="flex-grow overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Your Answer</h3>
              {isMCQ ? (
                additionalInfo.options && additionalInfo.options.length > 0 ? (
                  <div className="space-y-3">
                    {additionalInfo.options.map((opt, idx) => (
                      <label key={idx} className={`block cursor-pointer p-3 rounded hover:bg-[#2a2a2a] transition-colors duration-150 border ${selectedOption === opt ? 'border-yellow-500 bg-[#2a2a2a]' : 'border-transparent hover:border-neutral-700'}`}>
                        <input type="radio" name="mcq" value={opt} checked={selectedOption === opt} onChange={(e) => setSelectedOption(e.target.value)} className="mr-3 accent-yellow-500" /> {opt}
                      </label>
                    ))}
                  </div>
                ) : (<p className="text-gray-400">MCQ options not available for this problem.</p>)
              ) : (
                <textarea placeholder="Enter your code or answer here..." value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="w-full h-64 p-3 bg-[#252526] border border-neutral-600 rounded text-sm resize-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 outline-none leading-relaxed" />
              )}
            </div>
            <div className="text-right mt-6 shrink-0">
              <button onClick={handleSubmit} className="bg-[#34ad48] hover:bg-emerald-950 text-white px-6 py-2 rounded font-medium transition-colors duration-150 disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={!userId || !problem} // Disable if not logged in or problem not loaded
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemDetail;