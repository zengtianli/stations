"use client"

import { useState, useEffect } from 'react'
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import PageHeader from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

// API 地址 - 部署后改为 Railway 地址
const API_BASE = process.env.NEXT_PUBLIC_IRRIGATION_API || 'http://localhost:8001'

interface DailyData {
  date: string
  irrigation: number
  drainage: number
  crops: Record<string, number>  // 各作物需水量
}

interface ActiveCrop {
  name: string
  quota: number
  unit: string
}

interface ParameterPreview {
  start_date: string
  forecast_days: number
  warmup_days: number
  guarantee_rate: number
  mode: string
  active_crops: ActiveCrop[]
  total_single_crop: number
  total_double_crop: number
  total_dry_land: number
  current_period: string
  eva_ratio: number
  leakage: number
  rotation_batches: number
}

interface CropBreakdown {
  name: string
  area: number
  quota: number | null
  total: number
  daily_avg: number
  method: string
}

interface CategorySummary {
  category: string
  total: number
  percentage: number
  crops: CropBreakdown[]
}

interface CalculateResult {
  success: boolean
  total_irrigation: number
  total_drainage: number
  daily_data: DailyData[]
  breakdown: CategorySummary[]
  parameters: ParameterPreview
  message: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// 作物面积类型
interface CropAreas {
  rice: Record<string, number>
  dryland: Record<string, number>
}

export default function IrrigationPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CalculateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [params, setParams] = useState({
    start_date: '2025/07/15',
    forecast_days: 16,
    guarantee_rate: 90,
    mode: 'both'
  })

  // 面积编辑状态
  const [cropAreas, setCropAreas] = useState<CropAreas | null>(null)
  const [editAreas, setEditAreas] = useState<Record<string, number>>({})
  const [areasLoading, setAreasLoading] = useState(false)
  const [showAreaEditor, setShowAreaEditor] = useState(false)

  // 加载作物面积
  const loadCropAreas = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/crop-areas`)
      const data = await res.json()
      if (data.success) {
        setCropAreas({ rice: data.rice, dryland: data.dryland })
        setEditAreas({ ...data.rice, ...data.dryland })
      }
    } catch (err) {
      console.error('加载面积失败:', err)
    }
  }

  // 更新面积并重新计算
  const handleUpdateAreas = async () => {
    setAreasLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/crop-areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areas: editAreas })
      })
      const data = await res.json()
      if (data.success) {
        // 重新加载面积
        await loadCropAreas()
        // 自动重新计算
        setLoading(true)
        const calcRes = await fetch(`${API_BASE}/api/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        })
        const calcData = await calcRes.json()
        if (calcData.success) {
          setResult(calcData)
        }
        setLoading(false)
      }
    } catch (err) {
      setError(`更新面积失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
    setAreasLoading(false)
  }

  // 首次加载时获取面积
  useEffect(() => {
    loadCropAreas()
  }, [])

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      
      const data = await res.json()
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.message || '计算失败')
      }
    } catch (err) {
      setError(`连接失败: ${err instanceof Error ? err.message : '未知错误'}`)
    }
    
    setLoading(false)
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  }

  // 饼图数据：从 breakdown 中提取各作物需水量
  const pieData = result?.breakdown ? result.breakdown.flatMap(cat => 
    cat.crops.filter(c => c.total > 0).map(c => ({
      name: c.name,
      value: c.total,
      category: cat.category
    }))
  ) : []
  
  // 分类颜色
  const CATEGORY_COLORS: Record<string, string> = {
    '单季稻': '#3b82f6',
    '双季稻': '#60a5fa', 
    '蔬菜': '#10b981',
    '瓜果': '#f59e0b',
    '小麦': '#8b5cf6',
    '油菜': '#ec4899',
    '豆类': '#6366f1'
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-16 max-w-7xl">
        <PageHeader 
          title="农田灌溉需水计算" 
          description="浙东河网平原农田灌溉需水量在线计算系统" 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* 左侧：参数配置 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">参数配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 起始日期 */}
              <div className="space-y-2">
                <Label htmlFor="start_date">起始日期</Label>
                <Input
                  id="start_date"
                  value={params.start_date}
                  onChange={(e) => setParams({...params, start_date: e.target.value})}
                  placeholder="YYYY/MM/DD"
                />
              </div>
              
              {/* 预测天数 */}
              <div className="space-y-2">
                <Label htmlFor="forecast_days">预测天数</Label>
                <Input
                  id="forecast_days"
                  type="number"
                  value={params.forecast_days}
                  onChange={(e) => setParams({...params, forecast_days: parseInt(e.target.value) || 16})}
                  min={1}
                  max={365}
                />
              </div>
              
              {/* 灌溉保证率 */}
              <div className="space-y-2">
                <Label>灌溉保证率</Label>
                <div className="flex gap-4">
                  {[50, 75, 90].map((rate) => (
                    <label key={rate} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="guarantee_rate"
                        checked={params.guarantee_rate === rate}
                        onChange={() => setParams({...params, guarantee_rate: rate})}
                        className="w-4 h-4"
                      />
                      <span>{rate}%</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 计算模式 */}
              <div className="space-y-2">
                <Label>计算模式</Label>
                <div className="space-y-2">
                  {[
                    { value: 'crop', label: '旱地作物' },
                    { value: 'irrigation', label: '水稻灌溉' },
                    { value: 'both', label: '综合模式' },
                  ].map((mode) => (
                    <label key={mode.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={params.mode === mode.value}
                        onChange={() => setParams({...params, mode: mode.value})}
                        className="w-4 h-4"
                      />
                      <span>{mode.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 计算按钮 */}
              <Button 
                onClick={handleCalculate} 
                disabled={loading}
                className="w-full mt-4"
              >
                {loading ? '计算中...' : '开始计算'}
              </Button>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {/* 面积编辑折叠区 */}
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={() => setShowAreaEditor(!showAreaEditor)}
                  className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  <span>面积设置</span>
                  <span>{showAreaEditor ? '▲' : '▼'}</span>
                </button>
                
                {showAreaEditor && cropAreas && (
                  <div className="mt-4 space-y-4">
                    {/* 水稻面积 */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">水稻面积 (km²)</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(cropAreas.rice).map(([name, _]) => (
                          <div key={name} className="space-y-1">
                            <Label className="text-xs">{name}</Label>
                            <Input
                              type="number"
                              value={editAreas[name] || 0}
                              onChange={(e) => setEditAreas({
                                ...editAreas,
                                [name]: parseFloat(e.target.value) || 0
                              })}
                              className="h-8 text-sm"
                              step="0.01"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* 旱地作物面积 */}
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">旱地作物面积 (km²)</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(cropAreas.dryland).map(([name, _]) => (
                          <div key={name} className="space-y-1">
                            <Label className="text-xs">{name}</Label>
                            <Input
                              type="number"
                              value={editAreas[name] || 0}
                              onChange={(e) => setEditAreas({
                                ...editAreas,
                                [name]: parseFloat(e.target.value) || 0
                              })}
                              className="h-8 text-sm"
                              step="0.1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleUpdateAreas}
                      disabled={areasLoading}
                      variant="outline"
                      className="w-full text-sm"
                      size="sm"
                    >
                      {areasLoading ? '更新中...' : '应用面积修改'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* 右侧：计算结果 */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                {/* 总量统计 */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">总灌溉需水量</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(result.total_irrigation)} m³
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">总排水量</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(result.total_drainage)} m³
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* 趋势图 - 按作物分类 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">各作物灌溉需水量趋势</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={result.daily_data.map(d => ({
                        date: d.date.split('/').slice(1).join('/'),  // 简化日期显示
                        ...d.crops,
                        总计: d.irrigation
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatNumber(value) + ' m³', name]}
                          labelFormatter={(label) => `日期: ${label}`}
                        />
                        <Legend />
                        {/* 动态生成各作物的线 */}
                        {(() => {
                          // 获取所有作物名称
                          const cropNames = new Set<string>()
                          result.daily_data.forEach(d => {
                            Object.keys(d.crops || {}).forEach(name => cropNames.add(name))
                          })
                          return Array.from(cropNames).map((cropName, idx) => (
                            <Line 
                              key={cropName}
                              type="monotone" 
                              dataKey={cropName}
                              stroke={CATEGORY_COLORS[cropName] || COLORS[idx % COLORS.length]}
                              name={cropName}
                              strokeWidth={2}
                              dot={false}
                            />
                          ))
                        })()}
                        <Line 
                          type="monotone" 
                          dataKey="总计"
                          stroke="#666"
                          name="总计"
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* 需水量分类详情 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">需水量分类详情</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {result.breakdown?.map((cat, catIdx) => (
                        <div key={catIdx}>
                          <div className="flex items-center justify-between mb-3 pb-2 border-b">
                            <span className="font-semibold text-lg">{cat.category}</span>
                            <span className="text-muted-foreground">
                              {formatNumber(cat.total)} m³ ({cat.percentage}%)
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left py-2">作物</th>
                                  <th className="text-right py-2">面积(km²)</th>
                                  <th className="text-right py-2">计算方法</th>
                                  <th className="text-right py-2">需水量(m³)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cat.crops.map((crop, cropIdx) => (
                                  <tr key={cropIdx} className="border-t border-muted/30">
                                    <td className="py-2 flex items-center gap-2">
                                      <span 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: CATEGORY_COLORS[crop.name] || '#888' }}
                                      />
                                      {crop.name}
                                    </td>
                                    <td className="text-right py-2">{formatNumber(crop.area)}</td>
                                    <td className="text-right py-2 text-muted-foreground">
                                      {crop.quota ? `${formatNumber(crop.quota)} m³/km²` : crop.method}
                                    </td>
                                    <td className="text-right py-2 font-medium">
                                      {formatNumber(crop.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* 需水量分布饼图 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">需水量分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, value }) => `${name}: ${formatNumber(value)} m³`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatNumber(value) + ' m³'} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                {/* 参数预览 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">计算参数</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground">时间配置</div>
                        <div>起始: {result.parameters.start_date}</div>
                        <div>预测: {result.parameters.forecast_days} 天</div>
                        <div>预热: {result.parameters.warmup_days} 天</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">旱地作物</div>
                        <div>保证率: {result.parameters.guarantee_rate}%</div>
                        <div>有效作物: {
                          result.parameters.active_crops.length > 0 
                            ? result.parameters.active_crops.map(c => `${c.name}(${c.quota.toLocaleString()})`).join(', ')
                            : '无'
                        }</div>
                        <div>面积: {formatNumber(result.parameters.total_dry_land)} km²</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">水稻灌溉</div>
                        <div>生育期: {result.parameters.current_period}</div>
                        <div>蒸发系数: {result.parameters.eva_ratio}</div>
                        <div>渗漏: {result.parameters.leakage} mm/d</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* 逐日数据表格 - 按作物分类 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">逐日计算结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      {(() => {
                        // 获取所有作物名称
                        const cropNames = new Set<string>()
                        result.daily_data.forEach(d => {
                          Object.keys(d.crops || {}).forEach(name => cropNames.add(name))
                        })
                        const crops = Array.from(cropNames)
                        
                        return (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2 sticky left-0 bg-background">日期</th>
                                {crops.map(name => (
                                  <th key={name} className="text-right py-2 px-2 whitespace-nowrap">
                                    <span 
                                      className="inline-block w-2 h-2 rounded-full mr-1"
                                      style={{ backgroundColor: CATEGORY_COLORS[name] || '#888' }}
                                    />
                                    {name}
                                  </th>
                                ))}
                                <th className="text-right py-2 px-2 font-bold">总计(m³)</th>
                                <th className="text-right py-2 px-2">排水(m³)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.daily_data.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-muted/50">
                                  <td className="py-2 px-2 sticky left-0 bg-background">{row.date.split('/').slice(1).join('/')}</td>
                                  {crops.map(name => (
                                    <td key={name} className="text-right py-2 px-2 tabular-nums">
                                      {row.crops[name] ? formatNumber(row.crops[name]) : '-'}
                                    </td>
                                  ))}
                                  <td className="text-right py-2 px-2 font-medium tabular-nums">{formatNumber(row.irrigation)}</td>
                                  <td className="text-right py-2 px-2 tabular-nums">{formatNumber(row.drainage)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center text-muted-foreground">
                  <div className="text-4xl mb-4">🌾</div>
                  <div>配置参数后点击"开始计算"</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
