import { Routes, Route } from 'react-router-dom';
import { AnalyzerPage } from './pages/AnalyzerPage';

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<AnalyzerPage />} />
    </Routes>
  );
}
