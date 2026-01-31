-- 구매 가능하도록 리스팅 sale_type 수정 (SELL 또는 SELL_OR_EXCHANGE만 구매 가능)
-- "구매할 수 없는 리스팅입니다." 오류 시 실행

-- 리스팅 2번만 수정
UPDATE listing SET sale_type = 'SELL' WHERE listing_id = 2;

-- 또는 sale_type이 SELL/SELL_OR_EXCHANGE가 아닌 모든 리스팅 수정
-- UPDATE listing SET sale_type = 'SELL' WHERE sale_type IS NULL OR UPPER(sale_type) NOT IN ('SELL', 'SELL_OR_EXCHANGE');
