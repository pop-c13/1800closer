import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import LaunchScreen from './components/LaunchScreen';
import PresenterPanel from './components/PresenterPanel';
import ViewerView from './components/ViewerView';
import ManagerHub from './components/ManagerHub';
import ManagerLiveView from './components/ManagerLiveView';
import RepDetailView from './components/RepDetailView';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="font-dm min-h-screen">
          <Routes>
            <Route path="/" element={<LaunchScreen />} />
            <Route path="/present" element={<PresenterPanel />} />
            <Route path="/viewer" element={<ViewerView />} />
            <Route path="/manager" element={<ManagerHub />} />
            <Route path="/manager/live/:id" element={<ManagerLiveView />} />
            <Route path="/manager/rep/:repId" element={<RepDetailView />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
