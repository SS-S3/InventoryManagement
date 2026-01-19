import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Package, X } from 'lucide-react';
import { HoverEffect } from './ui/card-hover-effect';
import { CometCard } from './ui/comet-card';
import { cn } from '@/lib/utils';

const LabLayout = ({ token }) => {
  const [items, setItems] = useState([]);
  const [selectedCabinet, setSelectedCabinet] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:3000/items', { headers: { Authorization: token } });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const cabinets = [];
  for (let row = 1; row <= 4; row++) {
    for (let col = 1; col <= 4; col++) {
      const label = String.fromCharCode(64 + row) + col;
      cabinets.push(label);
    }
  }

  const getCabinetItemCount = (cabinet) => {
    return items.filter(item => item.cabinet === cabinet).length;
  };

  const cabinetItems = selectedCabinet ? items.filter(item => item.cabinet === selectedCabinet) : [];

  const hoverItems = cabinets.map(cabinet => {
    const count = getCabinetItemCount(cabinet);
    return {
      title: `Cabinet ${cabinet}`,
      description: count > 0 ? `${count} items stored` : 'Empty cabinet',
      link: '#', // We will handle click manually
      cabinet: cabinet,
      count: count
    };
  });

  return (
    <div className="space-y-8">
      <CometCard>
        <div className="flex justify-between items-center rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-xl p-6">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-500" />
            </div>
            Lab Cabinet Inventory Map
          </h2>
          <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-neutral-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>In Use</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-300 dark:bg-neutral-700"></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      </CometCard>

      <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-inner">
        <HoverEffect
          items={hoverItems}
          className="md:grid-cols-4 lg:grid-cols-4"
          onItemClick={(item) => setSelectedCabinet(selectedCabinet === item.cabinet ? null : item.cabinet)}
        />
      </div>

      {selectedCabinet && (
        <CometCard className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-3xl border border-blue-500/20 bg-white/90 dark:bg-neutral-900/80 backdrop-blur shadow-2xl p-8">
            <div className="flex justify-between items-center mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <h3 className="text-2xl font-bold flex items-center gap-3 text-neutral-800 dark:text-neutral-100">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
                Contents: Cabinet {selectedCabinet}
              </h3>
              <button
                onClick={() => setSelectedCabinet(null)}
                className="p-2 hover:bg-red-500/10 text-neutral-500 hover:text-red-500 transition-colors rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {cabinetItems.length === 0 ? (
              <div className="text-center py-20 text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-5" />
                <p className="text-xl font-medium">This storage unit is currently empty</p>
                <p className="text-sm">Assigned items will appear here after allocation.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {cabinetItems.map((item) => (
                  <div
                    key={item.id}
                    className="group p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2 text-neutral-800 dark:text-neutral-100 group-hover:text-blue-500 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                          {item.description || 'No detailed description available.'}
                        </p>
                      </div>
                      <div className="ml-4">
                        <div
                          className={cn(
                            "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm",
                            item.quantity === 0
                              ? 'bg-red-500/20 text-red-500'
                              : item.quantity < 5
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-green-500/20 text-green-500'
                          )}
                        >
                          {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CometCard>
      )}
    </div>
  );
};

export default LabLayout;
