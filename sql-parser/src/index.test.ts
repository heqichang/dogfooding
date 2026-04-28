// 简单测试文件，用于验证 Jest 配置

describe('基本测试', () => {
  it('应该能通过简单的断言', () => {
    expect(1 + 1).toBe(2);
  });

  it('应该能处理字符串', () => {
    expect('Hello World').toContain('Hello');
  });
});
