import React, { useState } from 'react';

// Disco disponible con peso en kg y cantidad
export interface Disc { w: number; label: string; maxQty: number; }

const availableDiscs: Disc[] = [
  { w: 5, label: '5 kg', maxQty: 4 },
  { w: 3, label: '3 kg', maxQty: 4 },
  { w: 0.5, label: '0.5 kg', maxQty: 2 },
  { w: 35 * 0.453592, label: '35 lb', maxQty: 2 },
  { w: 25 * 0.453592, label: '25 lb', maxQty: 2 },
  { w: 44 * 0.453592, label: '44 lb', maxQty: 2 },
].sort((a, b) => b.w - a.w); // ordenar discos de mayor a menor

const WeightCalculator: React.FC = () => {
  const [barWeight, setBarWeight] = useState<number>(15);
  const [targetTotal, setTargetTotal] = useState<number>(0);
  const [exact, setExact] = useState<string[]>([]);
  const [below, setBelow] = useState<{ weightPerSide: number; combo: string[] } | null>(null);
  const [above, setAbove] = useState<{ weightPerSide: number; combo: string[] } | null>(null);
  const [error, setError] = useState<string>('');

  // contar cuántos discos de cada tipo quedan
  const countDiscsUsed = (combo: string[]) => {
    const discCount: { [key: string]: number } = {};
    combo.forEach(d => { discCount[d] = (discCount[d] || 0) + 1; });
    return discCount;
  };

  // calcular peso total de discos en un combo
  const calculateWeight = (combo: string[]) =>
    combo.reduce((sum, label) => sum + (availableDiscs.find(d => d.label === label)?.w || 0), 0);

  // total ambos lados + barra
  const calculateTotalCombo = (combo: string[]) => calculateWeight(combo) * 2 + barWeight;

  // algoritmo voraz por lado
  const greedySide = (weight: number) => {
    let rem = weight;
    const combo: string[] = [];
    for (const d of availableDiscs) {
      let used = 0;
      const maxPerSide = Math.floor(d.maxQty / 2); // Corrección aquí
      while (rem >= d.w - 1e-6 && used < maxPerSide) { // Y aquí
        combo.push(d.label);
        rem = parseFloat((rem - d.w).toFixed(3));
        used++;
      }
    }
    // validar inventario
    const usedDiscs = countDiscsUsed(combo);
    for (const label in usedDiscs) {
      const max = availableDiscs.find(d => d.label === label)?.maxQty || 0;
      if (usedDiscs[label] > max) return { combo: [] as string[], rem: weight };
    }
    return { combo, rem };
  };
  const calculate = () => {
    setError(''); setExact([]); setBelow(null); setAbove(null);
    if (targetTotal <= barWeight) { setError('El peso objetivo debe ser mayor que la barra seleccionada.'); return; }
    const perSide = parseFloat(((targetTotal - barWeight) / 2).toFixed(3));
    if (perSide <= 0) { setError('Ingresa un peso total mayor que el peso de la barra.'); return; }

    const { combo, rem } = greedySide(perSide);
    if (rem < 1e-3) { setExact(combo); return; }

    const belowWeight = parseFloat((perSide - rem).toFixed(3));
    const { combo: cb } = greedySide(belowWeight);
    setBelow({ weightPerSide: belowWeight, combo: cb });

    const smallest = availableDiscs[availableDiscs.length - 1].w;
    const aboveWeight = parseFloat((belowWeight + smallest).toFixed(3));
    const { combo: ca } = greedySide(aboveWeight);
    setAbove({ weightPerSide: aboveWeight, combo: ca });
  };

  return (
    <div className="calculator-container">
      <h2>Calculadora de Pesas</h2>
      <label>
        Peso total objetivo (kg):{' '}
        <input type="number" step="0.1" value={targetTotal}
          onChange={e => setTargetTotal(parseFloat(e.target.value))} />
      </label>
      <label>
        Selecciona barra:{' '}
        <select value={barWeight} onChange={e => setBarWeight(parseFloat(e.target.value))}>
          <option value={15}>Barra 15 kg</option>
          <option value={20}>Barra 20 kg</option>
        </select>
      </label>
      <button type="button" onClick={calculate}>Calcular</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {exact.length > 0 && (
        <>
          <h3>Combinación exacta (por lado):</h3>
          <ul>{exact.map((d,i) => <li key={i}>{d}</li>)}</ul>
          <p>Total por lado: {calculateWeight(exact).toFixed(2)} kg</p>
          <p>Total (ambos lados + barra): {calculateTotalCombo(exact).toFixed(2)} kg</p>
        </>
      )}

{!exact.length && below && above && (
  <>
    <h3>Aproximaciones (por lado):</h3>
    {JSON.stringify(below.combo) === JSON.stringify(above.combo) ? (
      <div>
        <strong>Aproximación ({below.weightPerSide.toFixed(2)} kg):</strong>
        <ul>{below.combo.map((d, i) => <li key={i}>{d}</li>)}</ul>
        <p>Total por lado: {calculateWeight(below.combo).toFixed(2)} kg</p>
        <p>Total (ambos lados + barra): {calculateTotalCombo(below.combo).toFixed(2)} kg</p>
      </div>
    ) : (
      <>
        <div>
          <strong>Inferior ({below.weightPerSide.toFixed(2)} kg):</strong>
          <ul>{below.combo.map((d, i) => <li key={i}>{d}</li>)}</ul>
          <p>Total por lado: {calculateWeight(below.combo).toFixed(2)} kg</p>
          <p>Total (ambos lados + barra): {calculateTotalCombo(below.combo).toFixed(2)} kg</p>
        </div>
        <div>
          <strong>Superior ({above.weightPerSide.toFixed(2)} kg):</strong>
          <ul>{above.combo.map((d, i) => <li key={i}>{d}</li>)}</ul>
          <p>Total por lado: {calculateWeight(above.combo).toFixed(2)} kg</p>
          <p>Total (ambos lados + barra): {calculateTotalCombo(above.combo).toFixed(2)} kg</p>
        </div>
      </>
    )}
  </>
)}

    </div>
  );
};

export default WeightCalculator;
