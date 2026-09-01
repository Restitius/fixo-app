"""Transactions router — declares endpoints; logic lives in the controller."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps.request_context import GetRequestContext
from app.domains.transactions.api.controller import TransactionController

from app.domains.transactions.requests.create_transaction import CreateTransactionRequest as TransactionCreateRequest
from app.domains.transactions.requests.update_transaction import UpdateTransactionRequest as TransactionUpdateRequest
from app.domains.transactions.requests.categorize_transaction import CategorizeTransactionRequest as TransactionCategorizeRequest

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("", status_code=201)
async def create(payload: TransactionCreateRequest, ctx=GetRequestContext) -> dict:
    """TRANSACTIONS create endpoint -> TransactionController.Create."""
    return await TransactionController.Create(payload, ctx)

@router.patch("/{transaction_id}", status_code=200)
async def update(transaction_id: int, payload: TransactionUpdateRequest, ctx=GetRequestContext) -> dict:
    """TRANSACTIONS update endpoint -> TransactionController.Update."""
    return await TransactionController.Update(transaction_id, payload, ctx)

@router.post("/{transaction_id}/settle", status_code=201)
async def settle(transaction_id: int, ctx=GetRequestContext) -> dict:
    """TRANSACTIONS settle endpoint -> TransactionController.Settle."""
    return await TransactionController.Settle(transaction_id, ctx)

@router.post("/{transaction_id}/categorize", status_code=201)
async def categorize(transaction_id: int, payload: TransactionCategorizeRequest, ctx=GetRequestContext) -> dict:
    """TRANSACTIONS categorize endpoint -> TransactionController.Categorize."""
    return await TransactionController.Categorize(transaction_id, payload, ctx)
