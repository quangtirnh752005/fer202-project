import { InputNumber } from 'antd';
import { moneyFormatter, moneyParser } from '../utils/money';

/**
 * Ô nhập tiền dùng chung: bỏ mũi tên lên/xuống (một cú chạm nhầm là đổi số tiền)
 * và phân cách nghìn ngay khi gõ để đọc được "1,500,000" thay vì đếm số 0.
 */
export default function MoneyInput({ style, ...rest }) {
  return (
    <InputNumber
      {...rest}
      controls={false}
      formatter={moneyFormatter}
      parser={moneyParser}
      style={{ width: '100%', ...style }}
    />
  );
}
