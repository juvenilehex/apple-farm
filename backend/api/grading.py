"""급지 시스템 API — 지역별 사과 재배 적합도 등급."""
from __future__ import annotations

from fastapi import APIRouter

from schemas.grading import GradeResult, AllGradesResponse
from services.grading import get_orchard_grader

router = APIRouter(prefix="/api/grading", tags=["grading"])


@router.get("/region/{region_id}", response_model=GradeResult)
async def get_region_grade(region_id: str):
    """단일 지역 급지 평가."""
    return get_orchard_grader().grade_region(region_id)


@router.get("/all", response_model=AllGradesResponse)
async def get_all_grades():
    """전체 10개 주산지 급지 비교."""
    results = get_orchard_grader().grade_all()
    return AllGradesResponse(regions=results)
