import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Package, X } from 'lucide-react';
import { Button } from './ui/button';

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
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 5; col++) {
      const label = String.fromCharCode(64 + row) + col;
      cabinets.push(label);
    }
  }

  const getCabinetItemCount = (cabinet) => {
    return items.filter(item => item.cabinet === cabinet).length;
  };

  const getCabinetClass = (cabinet) => {
    const count = getCabinetItemCount(cabinet);
    const isSelected = selectedCabinet === cabinet;

    let baseClass = "h-20 w-20 text-lg font-bold rounded-xl transition-all cursor-pointer relative overflow-hidden ";

    if (isSelected) {
      baseClass += "ring-4 ring-primary shadow-lg scale-105 bg-primary text-white ";
    } else if (count > 0) {
      baseClass += "bg-gradient-to-br from-accent/20 to-primary/20 hover:from-accent/30 hover:to-primary/30 text-foreground border-2 border-primary/30 hover:scale-105 hover:shadow-lg ";
    } else {
      baseClass += "bg-card border-2 border-border/50 hover:border-primary/50 text-muted-foreground hover:text-foreground hover:scale-105 ";
    }

    return baseClass;
  };

  const cabinetItems = selectedCabinet ? items.filter(item => item.cabinet === selectedCabinet) : [];

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Lab Cabinet Layout (5x5 Grid)
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-accent/20 to-primary/20 border-2 border-primary/30"></div>
                <span className="text-muted-foreground">Has Items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-card border-2 border-border/50"></div>
                <span className="text-muted-foreground">Empty</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3 mb-6 p-4 bg-muted/20 rounded-xl">
            {cabinets.map(cabinet => {
              const itemCount = getCabinetItemCount(cabinet);
              return (
                <button
                  key={cabinet}
                  className={getCabinetClass(cabinet)}
                  onClick={() => setSelectedCabinet(selectedCabinet === cabinet ? null : cabinet)}
                >
                  <span className="relative z-10">{cabinet}</span>
                  {itemCount > 0 && (
                    <div className="absolute top-1 right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      {itemCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selectedCabinet && (
            <div className="mt-4 p-4 bg-primary/5 border-2 border-primary/20 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Cabinet {selectedCabinet}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCabinet(null)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {cabinetItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  📦 This cabinet is empty
                </p>
              ) : (
                <div className="grid gap-3">
                  {cabinetItems.map(item => (
                    <Card key={item.id} className="hover-lift">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-base mb-1">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description || 'No description'}</p>
                          </div>
                          <div className="ml-4">
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${item.quantity === 0
                                ? 'bg-destructive/20 text-destructive'
                                : item.quantity < 5
                                  ? 'bg-warning/20 text-warning'
                                  : 'bg-success/20 text-success'
                              }`}>
                              {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LabLayout;