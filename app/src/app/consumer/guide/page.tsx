'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  regionalApples, tasteProfiles, usageRecommendations, gradeInfo,
  storageTips, nutritionInfo, monthlyBuyingGuide, appleRecipes, supplyInfo,
} from '@/data/consumer';
import { useVarietyRecommendApi } from '@/lib/hooks/useVarietyRecommendApi';

type Tab = 'recommend' | 'regional' | 'grade' | 'storage' | 'recipe' | 'buying' | 'supply';

export default function ConsumerGuidePage() {
  const [tab, setTab] = useState<Tab>('recommend');
  const [selectedTaste, setSelectedTaste] = useState<string | null>(null);
  const [recipeCategory, setRecipeCategory] = useState<string>('all');
  const [recPriority, setRecPriority] = useState('balanced');
  const { result: recResult, source: recSource, loading: recLoading } = useVarietyRecommendApi(recPriority, 5);

  const currentMonth = new Date().getMonth() + 1;
  const currentBuying = monthlyBuyingGuide.find((b) => b.month === currentMonth);

  const filteredRecipes = recipeCategory === 'all'
    ? appleRecipes
    : appleRecipes.filter((r) => r.category === recipeCategory);

  const currentSupply = supplyInfo.monthlySupplyGuide.find((s) => s.month === currentMonth);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'recommend', label: '품종 추천' },
    { key: 'regional', label: '산지 정보' },
    { key: 'recipe', label: '레시피' },
    { key: 'grade', label: '등급 가이드' },
    { key: 'storage', label: '보관법' },
    { key: 'buying', label: '구매 시기' },
    { key: 'supply', label: '공급·가격' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-md px-2 py-0.5 font-medium text-white" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent)' }}>소비자</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>사과 가이드</span>
        </div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: 'var(--fs-3xl)', color: 'var(--text-primary)' }}>
          사과 선택 가이드
        </h1>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-tertiary)' }}>
          맛·용도·산지별 추천부터 레시피, 보관법, 구매 시기까지
        </p>
      </div>

      {/* This month's recommendation */}
      {currentBuying && (
        <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--brand-light)', background: 'var(--brand-subtle)', boxShadow: 'var(--shadow-1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--brand-text)' }}>{currentMonth}월 추천</span>
            {currentSupply && (
              <span className="rounded-full px-2 py-0.5 font-medium" style={{
                fontSize: 'var(--fs-xs)',
                background: currentSupply.supply === 'very-high' ? 'var(--status-success-bg)' : currentSupply.supply === 'high' ? 'var(--brand-subtle)' : 'var(--status-warning-bg)',
                color: currentSupply.supply === 'very-high' ? 'var(--status-success)' : currentSupply.supply === 'high' ? 'var(--brand-text)' : 'var(--status-warning)',
              }}>
                공급 {currentSupply.supply === 'very-high' ? '풍부' : currentSupply.supply === 'high' ? '많음' : currentSupply.supply === 'medium' ? '보통' : '적음'}
              </span>
            )}
          </div>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>{currentBuying.tip}</p>
          <p className="mt-2 font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--brand)' }}>
            Best Buy: {currentBuying.bestBuy}
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto" style={{ background: 'var(--surface-tertiary)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-lg font-medium transition-all whitespace-nowrap px-3"
            style={{
              fontSize: 'var(--fs-sm)',
              background: tab === t.key ? 'var(--surface-primary)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--shadow-1)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: 품종 추천 */}
      {tab === 'recommend' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
              어떤 맛을 좋아하세요?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {tasteProfiles.map((tp) => (
                <button
                  key={tp.id}
                  onClick={() => setSelectedTaste(selectedTaste === tp.id ? null : tp.id)}
                  className="rounded-xl border p-4 text-left transition-all"
                  style={{
                    borderColor: selectedTaste === tp.id ? 'var(--brand-light)' : 'var(--border-default)',
                    background: selectedTaste === tp.id ? 'var(--brand-subtle)' : 'var(--surface-primary)',
                    boxShadow: selectedTaste === tp.id ? 'var(--shadow-2)' : 'var(--shadow-1)',
                  }}
                >
                  <p className="font-bold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>{tp.label}</p>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{tp.description}</p>
                </button>
              ))}
            </div>

            {selectedTaste && (() => {
              const profile = tasteProfiles.find((p) => p.id === selectedTaste);
              if (!profile) return null;
              return (
                <div className="mt-4 rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--brand-light)', boxShadow: 'var(--shadow-1)' }}>
                  <h3 className="font-bold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--brand)' }}>
                    &ldquo;{profile.label}&rdquo; 추천 품종
                  </h3>
                  <div className="space-y-2">
                    {profile.varieties.map((v, i) => (
                      <div key={i} className="rounded-lg p-3 flex items-center gap-3" style={{ background: 'var(--surface-tertiary)' }}>
                        <span className="flex h-7 w-7 items-center justify-center rounded-full text-white font-bold" style={{ background: 'var(--brand-light)', fontSize: 'var(--fs-sm)' }}>
                          {i + 1}
                        </span>
                        <span className="font-medium" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Usage Recommendations */}
          <div>
            <h2 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
              용도별 추천
            </h2>
            <div className="space-y-4">
              {usageRecommendations.map((rec) => (
                <div key={rec.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
                  <h3 className="font-bold mb-1" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{rec.usage}</h3>
                  <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>{rec.description}</p>
                  <div className="space-y-2 mb-3">
                    {rec.bestVarieties.map((v, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg p-2.5" style={{ background: 'var(--surface-tertiary)' }}>
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white font-bold" style={{ background: 'var(--brand-light)', fontSize: '11px' }}>
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{v.name}</span>
                          <span className="ml-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{v.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>Tip: {rec.tips}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Variety Recommendation */}
          {recSource === 'backend' && recResult && (
            <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--accent)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
                  품종 추천
                </h2>
                <span className="rounded-full px-2 py-0.5 font-medium" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  서버 분석
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: 'balanced', label: '균형 잡힌' },
                  { key: 'profit', label: '수익성 높은' },
                  { key: 'easy', label: '재배 쉬운' },
                  { key: 'storage', label: '저장성 좋은' },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setRecPriority(p.key)}
                    className="rounded-lg px-3 py-1.5 font-medium transition-all"
                    style={{
                      fontSize: 'var(--fs-sm)',
                      background: recPriority === p.key ? 'var(--accent)' : 'var(--surface-tertiary)',
                      color: recPriority === p.key ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {recLoading ? (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>추천 분석 중...</p>
              ) : (
                <div className="space-y-2">
                  {recResult.recommendations.map((rec, i) => (
                    <div key={rec.variety.id} className="flex items-start gap-3 rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white font-bold" style={{ background: 'var(--accent)', fontSize: 'var(--fs-sm)' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                            {rec.variety.name}
                          </span>
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                            {rec.variety.name_en}
                          </span>
                          <span className="rounded-full px-2 py-0.5 font-bold tabular-nums" style={{
                            fontSize: 'var(--fs-xs)',
                            background: rec.score >= 80 ? 'var(--status-success-bg)' : rec.score >= 60 ? 'var(--status-warning-bg)' : 'var(--surface-tertiary)',
                            color: rec.score >= 80 ? 'var(--status-success)' : rec.score >= 60 ? 'var(--status-warning)' : 'var(--text-muted)',
                          }}>
                            {rec.score}점
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.reasons.map((reason, j) => (
                            <span key={j} className="rounded px-1.5 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--brand-subtle)', color: 'var(--brand-text)' }}>
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Nutrition */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="font-semibold mb-3" style={{ fontSize: 'var(--fs-xl)', color: 'var(--text-primary)' }}>
              사과 영양 정보 (100g 기준)
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              <NutritionCard label="칼로리" value={`${nutritionInfo.calories}kcal`} />
              <NutritionCard label="탄수화물" value={`${nutritionInfo.carbs}g`} />
              <NutritionCard label="식이섬유" value={`${nutritionInfo.fiber}g`} />
              <NutritionCard label="비타민C" value={`${nutritionInfo.vitaminC}mg`} />
              <NutritionCard label="칼륨" value={`${nutritionInfo.potassium}mg`} />
            </div>
            <div className="space-y-2">
              {nutritionInfo.benefits.map((b, i) => (
                <div key={i} className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <span className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{b.title}</span>
                  <span className="ml-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>{b.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 산지 정보 */}
      {tab === 'regional' && (
        <div className="space-y-4">
          <p className="mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
            지역별 기후 조건과 특산 품종을 확인하세요. 같은 품종도 산지에 따라 맛이 다릅니다.
          </p>
          {regionalApples.map((region) => (
            <div key={region.region} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{region.region}</h3>
                <span className="rounded-full px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--surface-tertiary)', color: 'var(--text-muted)' }}>
                  {region.province}
                </span>
                <span className="rounded-full px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  {region.elevation}
                </span>
              </div>
              <p className="mb-3" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{region.climate}</p>
              <div className="space-y-2">
                {region.specialties.map((s, i) => (
                  <div key={i} className="rounded-lg p-3" style={{ background: 'var(--brand-subtle)' }}>
                    <span className="font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand-text)' }}>{s.variety}</span>
                    <span className="ml-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{s.reason}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>수확 시기: {region.harvestSeason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: 레시피 */}
      {tab === 'recipe' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {[
              { key: 'all', label: '전체' },
              { key: 'dessert', label: '디저트' },
              { key: 'drink', label: '음료' },
              { key: 'meal', label: '식사' },
              { key: 'preserve', label: '저장식' },
            ].map((f) => (
              <button key={f.key} onClick={() => setRecipeCategory(f.key)}
                className="px-3 py-1.5 rounded-lg font-medium"
                style={{
                  fontSize: 'var(--fs-sm)',
                  background: recipeCategory === f.key ? 'var(--accent)' : 'var(--surface-primary)',
                  color: recipeCategory === f.key ? '#fff' : 'var(--text-secondary)',
                  border: recipeCategory === f.key ? 'none' : '1px solid var(--border-default)',
                }}
              >{f.label}</button>
            ))}
          </div>

          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{recipe.name}</h3>
                <span className="rounded-full px-2 py-0.5 font-medium" style={{
                  fontSize: 'var(--fs-xs)',
                  background: recipe.category === 'dessert' ? 'var(--status-danger-bg)' : recipe.category === 'drink' ? 'var(--accent-subtle)' : recipe.category === 'meal' ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
                  color: recipe.category === 'dessert' ? 'var(--status-danger)' : recipe.category === 'drink' ? 'var(--accent)' : recipe.category === 'meal' ? 'var(--status-success)' : 'var(--status-warning)',
                }}>
                  {recipe.categoryLabel}
                </span>
                <span className="rounded-full px-2 py-0.5" style={{
                  fontSize: 'var(--fs-xs)',
                  background: 'var(--surface-tertiary)',
                  color: recipe.difficulty === 'easy' ? 'var(--status-success)' : recipe.difficulty === 'medium' ? 'var(--status-warning)' : 'var(--status-danger)',
                }}>
                  {recipe.difficulty === 'easy' ? '쉬움' : recipe.difficulty === 'medium' ? '보통' : '어려움'}
                </span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{recipe.time}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                <span className="font-medium" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>추천 품종:</span>
                {recipe.bestVarieties.map((v) => (
                  <span key={v} className="rounded-full px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--brand-subtle)', color: 'var(--brand-text)' }}>
                    {v}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                {/* Ingredients */}
                <div className="rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>재료</p>
                  <ul className="space-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>• {ing}</li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div className="rounded-lg p-3" style={{ background: 'var(--accent-subtle)' }}>
                  <p className="font-medium mb-2" style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>만드는 법</p>
                  <ol className="space-y-1.5">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white font-bold mt-0.5" style={{ background: 'var(--accent)', fontSize: '10px' }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>Tip: {recipe.tip}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: 등급 가이드 */}
      {tab === 'grade' && (
        <div className="space-y-4">
          <p className="mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
            사과 등급은 외관·크기·당도로 결정됩니다. 맛과 영양은 등급과 무관할 수 있습니다.
          </p>
          {gradeInfo.map((g) => (
            <div key={g.grade} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full px-3 py-1 font-bold text-white" style={{
                  fontSize: 'var(--fs-sm)',
                  background: g.grade === '특' ? 'var(--status-danger)' : g.grade === '상' ? 'var(--status-warning)' : 'var(--text-muted)',
                }}>
                  {g.label}
                </span>
                <span className="font-bold tabular-nums" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>
                  {g.priceRange}
                </span>
              </div>
              <p className="mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>{g.description}</p>
              <div className="rounded-lg p-3 mb-2" style={{ background: 'var(--surface-tertiary)' }}>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>기준:</strong> {g.criteria}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--status-success-bg)' }}>
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--status-success)' }}>
                  <strong>추천:</strong> {g.recommendation}
                </p>
              </div>
            </div>
          ))}

          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)', boxShadow: 'var(--shadow-1)' }}>
            <p className="font-semibold mb-1" style={{ fontSize: 'var(--fs-base)', color: 'var(--accent)' }}>
              알아두세요
            </p>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              &ldquo;보통&rdquo; 등급 사과도 맛과 영양은 특등급과 같습니다. 외관상 차이일 뿐이에요.
              주스나 요리용이라면 보통 등급이 가성비 최고입니다.
            </p>
          </div>
        </div>
      )}

      {/* Tab: 보관법 */}
      {tab === 'storage' && (
        <div className="space-y-4">
          {storageTips.map((tip) => (
            <div key={tip.method} className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{tip.method}</h3>
                <span className="rounded-full px-2 py-0.5" style={{ fontSize: 'var(--fs-xs)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                  {tip.temperature}
                </span>
              </div>
              <p className="mb-3 font-medium" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>
                보관 기간: {tip.duration}
              </p>
              <div className="space-y-2">
                {tip.tips.map((t, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: 'var(--surface-tertiary)' }}>
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white font-bold" style={{ background: 'var(--brand-light)', fontSize: '11px' }}>
                      {i + 1}
                    </span>
                    <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--status-warning)', background: 'var(--status-warning-bg)', boxShadow: 'var(--shadow-1)' }}>
            <p className="font-semibold mb-1" style={{ fontSize: 'var(--fs-base)', color: 'var(--status-warning)' }}>
              에틸렌 가스 주의
            </p>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
              사과는 에틸렌 가스를 많이 방출합니다. 다른 과일·채소와 함께 보관하면
              숙성이 빨라져 빨리 상할 수 있어요. 반드시 비닐로 밀봉하거나 별도 보관하세요.
            </p>
          </div>
        </div>
      )}

      {/* Tab: 구매 시기 */}
      {tab === 'buying' && (
        <div className="space-y-4">
          <p className="mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
            월별 사과 시장 동향과 최적 구매 시기를 안내합니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monthlyBuyingGuide.map((guide) => {
              const isCurrent = guide.month === currentMonth;
              const isOff = guide.bestBuy.includes('비추천');
              return (
                <div key={guide.month} className="rounded-xl border bg-[var(--surface-primary)] p-4"
                  style={{
                    borderColor: isCurrent ? 'var(--brand-light)' : 'var(--border-default)',
                    boxShadow: isCurrent ? 'var(--shadow-2)' : 'var(--shadow-1)',
                    background: isCurrent ? 'var(--brand-subtle)' : 'var(--surface-primary)',
                    opacity: isOff ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: isCurrent ? 'var(--brand)' : 'var(--text-primary)' }}>
                      {guide.month}월
                    </span>
                    {isCurrent && (
                      <span className="rounded-full px-2 py-0.5 text-white font-medium" style={{ fontSize: '10px', background: 'var(--brand)' }}>
                        이번 달
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{guide.tip}</p>
                  {!isOff && (
                    <p className="mt-2 font-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--brand)' }}>
                      추천: {guide.bestBuy}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-bold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              가격 절약 팁
            </h3>
            <div className="space-y-2">
              {[
                '추석/설 성수기 직후에 구매하면 20~30% 저렴',
                '산지 직거래가 마트보다 평균 30% 저렴 (농협 직거래장터, 산지 직송)',
                '보통 등급을 대량 구매하면 kg당 50% 이상 절약',
                '공동구매/꾸러미 구독 서비스 활용',
                '냉동·착즙용이라면 비품(외관 불량) 활용 — 최대 70% 절약',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: 'var(--status-success-bg)' }}>
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white font-bold" style={{ background: 'var(--status-success)', fontSize: '11px' }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: 공급·가격 */}
      {tab === 'supply' && (
        <div className="space-y-4">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>연간 생산량</p>
              <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{supplyInfo.annualProduction}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>국내산 비율</p>
              <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--status-success)' }}>{supplyInfo.selfSufficiency}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>수입량</p>
              <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>{supplyInfo.importVolume}</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: 'var(--surface-tertiary)' }}>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>수출량</p>
              <p className="font-bold" style={{ fontSize: 'var(--fs-lg)', color: 'var(--accent)' }}>{supplyInfo.exportVolume}</p>
            </div>
          </div>

          {/* Monthly Supply */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-bold mb-4" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              월별 공급량
            </h3>
            <div className="space-y-2">
              {supplyInfo.monthlySupplyGuide.map((s) => {
                const isCurrent = s.month === currentMonth;
                const barWidth = s.supply === 'very-high' ? 100 : s.supply === 'high' ? 70 : s.supply === 'medium' ? 45 : s.supply === 'low' ? 25 : 10;
                const barColor = s.supply === 'very-high' ? 'var(--status-success)' : s.supply === 'high' ? 'var(--brand-light)' : s.supply === 'medium' ? 'var(--status-warning)' : 'var(--status-danger)';
                return (
                  <div key={s.month} className="flex items-center gap-3 rounded-lg p-2" style={{
                    background: isCurrent ? 'var(--brand-subtle)' : 'transparent',
                  }}>
                    <span className="w-8 text-right font-bold" style={{
                      fontSize: 'var(--fs-sm)',
                      color: isCurrent ? 'var(--brand)' : 'var(--text-primary)',
                    }}>
                      {s.month}월
                    </span>
                    <div className="flex-1">
                      <div className="w-full rounded-full h-4" style={{ background: 'var(--surface-tertiary)' }}>
                        <div className="rounded-full h-4" style={{ width: `${barWidth}%`, background: barColor }} />
                      </div>
                    </div>
                    <span className="w-40 text-right" style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
                      {s.note}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price Formation */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
            <h3 className="font-bold mb-3" style={{ fontSize: 'var(--fs-lg)', color: 'var(--text-primary)' }}>
              사과 가격은 어떻게 결정되나요?
            </h3>
            <div className="space-y-2">
              {supplyInfo.priceFormation.map((item, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-3" style={{ background: 'var(--surface-tertiary)' }}>
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white font-bold mt-0.5" style={{ background: 'var(--accent)', fontSize: '10px' }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="rounded-xl border bg-[var(--surface-primary)] p-5" style={{ borderColor: 'var(--accent)', background: 'var(--accent-subtle)', boxShadow: 'var(--shadow-1)' }}>
            <p className="font-semibold mb-2" style={{ fontSize: 'var(--fs-base)', color: 'var(--accent)' }}>
              소비자가 알아야 할 핵심
            </p>
            <div className="space-y-1">
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                • <strong>최대 출하기(10~11월)</strong>에 가격 가장 낮고 품질 가장 좋습니다
              </p>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                • <strong>추석·설 직후</strong>에 사면 성수기 대비 20~30% 저렴합니다
              </p>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                • <strong>4~7월은 비추천</strong> — 저장 사과만 유통되어 신선도 떨어집니다
              </p>
              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)' }}>
                • <strong>기상이변 해</strong>에는 작황 확인 후 구매 — 가격 급등 가능
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cross-links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/varieties" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>품종 도감에서 상세 비교 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>40+ 품종의 당도, 식감, 시장가치 비교</p>
        </Link>
        <Link href="/price" className="rounded-xl border bg-[var(--surface-primary)] p-5 transition-all duration-150 hover:border-[var(--border-strong)]"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-1)' }}>
          <p className="font-semibold" style={{ fontSize: 'var(--fs-base)', color: 'var(--text-primary)' }}>오늘 경매 시세 확인 →</p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-tertiary)' }}>도매시장 품종별 가격 추이</p>
        </Link>
      </div>
    </div>
  );
}

function NutritionCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-2.5 text-center" style={{ background: 'var(--surface-tertiary)' }}>
      <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-bold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}
