import Temperature from './Temperature';
import Humidity from './Humidity';
import MostVisted from './MostVisted';
import User from './User';

function StatisticsPage() {
  return (
    <div class="flex-1 p-4 md:p-6 overflow-visible md:overflow-hidden">
      <div class="flex flex-col md:grid md:grid-cols-2 md:grid-rows-2 gap-4 md:gap-6 h-auto md:h-full w-full">
        <Temperature />
        <Humidity />
        <MostVisted />
        <User />
      </div>
    </div>
  )
}

export default StatisticsPage;