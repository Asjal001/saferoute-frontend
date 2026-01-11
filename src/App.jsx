import { useState } from 'react'
import axios from 'axios'
import { 
  MapPin, Clock, Cloud, Navigation, ShieldCheck, 
  AlertTriangle, Car, Activity, ChevronDown, CheckCircle, Info, XCircle, Cpu, Database, Layers
} from 'lucide-react'

function App() {
  // --- STATE ---
  const [formData, setFormData] = useState({
    hour: new Date().getHours(),
    day: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
    lat: 31.5204,
    lon: 74.3587,
    speed: 40,
    road: 'RD-285',
    weather: 'Clear'
  })
  
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [useCurrentTime, setUseCurrentTime] = useState(true)
  const [geoStatus, setGeoStatus] = useState(null)

  // --- HANDLERS ---
  
  const showFieldError = (field, message) => {
    setFieldErrors(prev => ({ ...prev, [field]: message }))
    setTimeout(() => {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }, 3000)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // VALIDATION
    if (name === 'speed' && value < 0) {
      showFieldError('speed', "Speed cannot be negative")
      return 
    }
    if (name === 'hour' && (value < 0 || value > 23)) {
      showFieldError('hour', "Hour must be 0-23")
      return 
    }

    setFormData({ ...formData, [name]: value })
    if (globalError) setGlobalError(null)
  }

  const handleGetLocation = () => {
    setGeoStatus('loading')
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            lat: parseFloat(position.coords.latitude.toFixed(4)),
            lon: parseFloat(position.coords.longitude.toFixed(4))
          })
          setGeoStatus('success')
          setTimeout(() => setGeoStatus(null), 3000)
        },
        (error) => {
          console.error(error)
          setGeoStatus('error')
        }
      )
    } else {
      setGeoStatus('error')
    }
  }

  const toggleTimeMode = () => {
    if (!useCurrentTime) {
      const now = new Date()
      const modelDay = now.getDay() === 0 ? 6 : now.getDay() - 1
      setFormData({ ...formData, hour: now.getHours(), day: modelDay })
    }
    setUseCurrentTime(!useCurrentTime)
  }

  const handlePredict = async () => {
    setLoading(true)
    setGlobalError(null) 
    
    try {
      // 1. SANITIZE INPUTS (Fixes the "31.5204e" crash)
      const latClean = parseFloat(formData.lat)
      const lonClean = parseFloat(formData.lon)
      const speedClean = parseFloat(formData.speed)
      const hourClean = parseInt(formData.hour)

      // Check if any number is Invalid (NaN)
      if (isNaN(latClean) || isNaN(lonClean)) {
        throw new Error("Invalid GPS Coordinates. Please enter valid numbers.")
      }
      if (isNaN(speedClean)) {
        throw new Error("Invalid Speed value.")
      }

      const payload = {
        ...formData,
        hour: hourClean,
        day: parseInt(formData.day),
        lat: latClean,
        lon: lonClean,
        speed: speedClean
      }
      
      // Change localhost to your new Render URL
      const res = await axios.post('https://saferoute-api.onrender.com/predict', payload)
      setResult(res.data)
      
    } catch (err) {
      console.error("Error:", err)
      // Display the specific error message
      setGlobalError(err.message || "Server Unreachable. Is Python running?")
    }
    setLoading(false)
  }

  // --- HELPERS ---
  const getRiskColor = (label) => {
    if (label.includes("Safe")) return "text-emerald-600 bg-emerald-50 border-emerald-200"
    if (label.includes("Caution")) return "text-amber-600 bg-amber-50 border-amber-200"
    return "text-rose-600 bg-rose-50 border-rose-200"
  }

  const getRecommendation = (label) => {
    if (label === "Safe") return "Conditions look optimal. Standard driving precautions apply."
    if (label === "Caution") return "Moderate risk detected. Drive carefully and maintain a safe distance."
    if (label === "Danger") return "Hazardous conditions predicted. Reduce speed immediately and stay alert."
    if (label === "High Risk Area") return "Extreme danger predicted. Avoid this route if possible or delay travel."
    return "Analyzing conditions..."
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      
      {/* --- NEW DARK HEADER --- */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-center items-center relative">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <Navigation size={24} />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white block leading-none">
                SafeRoute<span className="text-blue-400">.ai</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1 block">
                Traffic Intelligence System
              </span>
            </div>
          </div>

        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 grid lg:grid-cols-12 gap-12">
        
        {/* LEFT COL: CONTROLS */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Predict Traffic.<br />Avoid Accidents.
            </h1>
            <p className="text-slate-500 text-lg">
              AI-powered safety forecasting for urban navigation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            
            {/* Location */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-600"/> Location Coordinates
                </label>
                <button onClick={handleGetLocation} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 transition-colors hover:text-blue-800">
                  <Navigation size={12} /> Use Current GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" name="lat" placeholder="Latitude" value={formData.lat} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-slate-600" />
                <input type="number" name="lon" placeholder="Longitude" value={formData.lon} onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-slate-600" />
              </div>
              {geoStatus === 'success' && <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 animate-fade-in"><CheckCircle size={12} /> GPS updated successfully.</div>}
              {geoStatus === 'error' && <div className="text-xs text-rose-500 font-medium flex items-center gap-1 animate-fade-in"><AlertTriangle size={12} /> Location access denied.</div>}
            </div>

            {/* Time */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600"/> Time & Date
                </label>
                <div className="flex items-center gap-2 cursor-pointer group" onClick={toggleTimeMode}>
                  <span className={`text-xs font-bold transition-colors ${useCurrentTime ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Current Time</span>
                  <div className={`w-10 h-5 rounded-full flex items-center transition-colors p-1 ${useCurrentTime ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${useCurrentTime ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
              </div>
              {!useCurrentTime && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in relative">
                  <div>
                    <input type="number" name="hour" placeholder="Hour" value={formData.hour} onChange={handleChange}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm outline-none transition ${fieldErrors.hour ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-500'}`} />
                    {fieldErrors.hour && <div className="text-rose-500 text-[10px] font-bold mt-1 absolute animate-pulse">{fieldErrors.hour}</div>}
                  </div>
                  
                  <div className="relative">
                    <select name="day" value={formData.day} onChange={handleChange}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 transition cursor-pointer text-slate-700">
                      <option value="0">Monday</option><option value="1">Tuesday</option><option value="2">Wednesday</option>
                      <option value="3">Thursday</option><option value="4">Friday</option><option value="5">Saturday</option><option value="6">Sunday</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
              )}
            </div>

            {/* Other Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Avg Speed (km/h)</label>
                <div className="relative">
                  <Car size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="number" name="speed" value={formData.speed} onChange={handleChange}
                    className={`w-full pl-10 bg-slate-50 border rounded-xl px-4 py-3 text-sm outline-none transition ${fieldErrors.speed ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-blue-500'}`} />
                </div>
                {fieldErrors.speed && <div className="text-rose-500 text-[10px] font-bold mt-1 absolute animate-pulse">{fieldErrors.speed}</div>}
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Weather</label>
                <div className="relative">
                  <Cloud size={16} className="absolute left-3 top-3.5 text-slate-400" />
                  <select name="weather" value={formData.weather} onChange={handleChange}
                    className="w-full pl-10 appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 cursor-pointer text-slate-700">
                    <option value="Clear">Clear</option><option value="Rain">Rain</option><option value="Fog">Fog</option>
                    <option value="Storm">Storm</option><option value="Snow">Snow</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* ACTION AREA */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={handlePredict} disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-300 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 border border-slate-900"
              >
                {loading ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</span>
                ) : (
                  <>
                    <Activity size={18} /> Analyze Route Safety
                  </>
                )}
              </button>
              
              {globalError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                  <XCircle size={18} className="mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block mb-0.5">Input Error</span>
                    {globalError}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COL: RESULTS */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {!result ? (
            <div className="h-full border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-12 bg-slate-100/50">
              <div className="bg-white p-6 rounded-full mb-6 shadow-sm">
                <Navigation size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-600">Awaiting Input</h3>
              <p className="text-sm mt-2 max-w-xs text-center text-slate-500">
                Configure your route parameters on the left to generate a real-time safety assessment.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Analysis Report</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Traffic Card */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition">
                  <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition">
                    <Car size={100} />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Car size={20}/></div>
                    <span className="font-semibold text-slate-500">Traffic Volume</span>
                  </div>
                  <div className="text-5xl font-extrabold text-slate-800 mb-2">{result.vehicle_count}</div>
                  <div className="text-sm font-medium text-slate-400">Predicted Vehicles</div>
                  <div className="mt-6 inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                    {result.traffic_density} Density
                  </div>
                </div>

                {/* Risk Card */}
                <div className={`p-8 rounded-3xl shadow-sm border relative overflow-hidden group hover:shadow-md transition ${getRiskColor(result.risk_label)}`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                    <AlertTriangle size={100} />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/50 rounded-lg"><ShieldCheck size={20}/></div>
                    <span className="font-semibold opacity-80">Safety Score</span>
                  </div>
                  <div className="text-5xl font-extrabold mb-2">{result.accident_likelihood}%</div>
                  <div className="text-sm font-medium opacity-70">Accident Probability</div>
                  <div className="mt-6 inline-block px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm text-sm font-bold border border-white/20">
                    {result.risk_label}
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl flex items-start gap-4 shadow-xl">
                <div className="bg-blue-600 p-2 rounded-lg text-white mt-1">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">AI Recommendation</h4>
                  <p className="text-sm leading-relaxed opacity-90">
                    {getRecommendation(result.risk_label)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- NEW DARK FOOTER --- */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-auto pt-16 pb-12 text-slate-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-3 gap-12 mb-12">
          
          {/* Model Architecture */}
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-white flex items-center gap-2 text-lg">
              <Cpu size={20} className="text-blue-500"/> Model Architecture
            </h5>
            <p className="text-sm leading-relaxed opacity-80">
              Multi-Output Neural Network (Keras/TensorFlow). Features 3 dense layers with dual branching for simultaneous Regression (Vehicle Count) and Classification (Risk).
            </p>
          </div>

          {/* Dataset Info */}
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-white flex items-center gap-2 text-lg">
              <Database size={20} className="text-blue-500"/> Dataset Specs
            </h5>
            <p className="text-sm leading-relaxed opacity-80">
              Trained on "Synthetic Urban Traffic v2.0". Contains 5,000+ samples of temporal, spatial, and weather conditions optimized for urban congestion patterns.
            </p>
          </div>

          {/* Performance Metrics */}
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-white flex items-center gap-2 text-lg">
              <Layers size={20} className="text-blue-500"/> Performance
            </h5>
            <p className="text-sm leading-relaxed opacity-80">
              <span className="block mb-1"><strong>Accuracy:</strong> ~82% (Test Set)</span>
              <span className="block mb-1"><strong>Loss Function:</strong> MAE (Count) / MSE (Risk)</span>
              <span className="block"><strong>Optimizer:</strong> Adam (lr=0.001)</span>
            </p>
          </div>

        </div>
        
        <div className="border-t border-slate-800 pt-8 text-center">
          <p className="text-slate-600 text-xs font-medium tracking-wide">
            © 2026 SAFEROUTE AI • TERM PROJECT
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App