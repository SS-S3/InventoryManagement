import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

  const cabinetItems = selectedCabinet ? items.filter(item => item.cabinet === selectedCabinet) : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lab Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {cabinets.map(cabinet => (
              <button
                key={cabinet}
                className={`h-16 w-16 text-lg font-bold border rounded ${selectedCabinet === cabinet ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
                onClick={() => setSelectedCabinet(cabinet)}
              >
                {cabinet}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCabinet && (
        <Card>
          <CardHeader>
            <CardTitle>Items in {selectedCabinet}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {cabinetItems.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-lg">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-sm font-semibold">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LabLayout;