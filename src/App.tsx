import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashPage from "./components/SplashPage";
import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import QuizPage from "./components/QuizPage";
import ResultPage from "./components/ResultPage";
import RankingPage from "./components/RankingPage";
import CreateProfilePage from "./components/CreateProfilePage";
import HowToPlayPage from "./components/HowToPlayPage";
import VerseOfTheDayPage from "./components/VerseOfTheDayPage";
import AdminQuestionsPage from "./components/AdminQuestionsPage";
import { isConfigured } from "./services/supabaseClient";

export default function App() {
  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Supabase Not Configured</h1>
          <p className="text-gray-700 mb-4">
            The application requires Supabase environment variables to function.
          </p>
          <div className="bg-gray-100 p-4 rounded text-left text-sm font-mono mb-4 overflow-x-auto">
            <p>Please create a <strong>.env</strong> file in the root directory with:</p>
            <pre className="mt-2 text-xs">
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
            </pre>
          </div>
          <p className="text-sm text-gray-500">
            Check the browser console for more details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/resultado" element={<ResultPage />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/perfil/criar" element={<CreateProfilePage />} />
        <Route path="/como-jogar" element={<HowToPlayPage />} />
        <Route path="/versiculo-do-dia" element={<VerseOfTheDayPage />} />
        <Route path="/admin/perguntas" element={<AdminQuestionsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
