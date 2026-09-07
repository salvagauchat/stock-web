from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import balance as crud
from app.database import get_db
from app.deps import get_current_user
from app.schemas.balance import BalanceOut

router = APIRouter(prefix="/balance", tags=["balance"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=BalanceOut)
async def obtener(desde: datetime, hasta: datetime, db: AsyncSession = Depends(get_db)):
    return await crud.obtener_balance(db, desde, hasta)
