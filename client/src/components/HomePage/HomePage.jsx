import Banner from './Banner';
import Status from './Status';
import ControlSystem from './ControlSystem';
import ChatBot from './ChatBot';

function HomePage() {
  return (
    <div class="h-[calc(100vh-64px)] p-4 md:p-6 overflow-y-auto lg:overflow-hidden custom-scroll">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
        <div class="col-span-12 lg:col-span-8 flex flex-col h-full gap-5 min-h-0">
          <Banner />
          <Status />
        </div>
        <div class="col-span-12 lg:col-span-4 flex flex-col h-full gap-5 min-h-0">
          <ControlSystem />
          <ChatBot />
        </div>
      </div>  
    </div>
  )
}

export default HomePage;