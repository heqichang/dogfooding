const TEXTS = {
    english: {
        elementary: [
            'The cat sat on the mat. It was a sunny day. The cat liked to sleep in the sun. Sometimes it chased butterflies. The dog came by and said hello. They played together in the yard.',
            'I like to read books. My favorite book is about animals. There are lions, tigers, and elephants. I want to visit the zoo someday. My mom says we can go next month. I am very excited.',
            'Today is my birthday. I am eight years old. My friends came to my party. We played games and ate cake. My cake was chocolate with vanilla frosting. I got many nice presents.',
            'The sun rises in the morning. It gives us light and heat. Plants need sunlight to grow. We need sunlight to see. At night, the moon comes out. Stars twinkle in the dark sky.',
            'I have a pet dog named Max. He is brown and white. He likes to play fetch. Every morning I take him for a walk. He wags his tail when he is happy. Max is my best friend.'
        ],
        middle: [
            'Reading is a wonderful habit that everyone should develop. It not only entertains us but also helps us learn new things. Through books, we can travel to different places and meet interesting people. Reading improves our vocabulary and makes us better writers. It also helps us understand the world around us better.',
            'Exercise is important for our health. People who exercise regularly feel better and live longer. There are many ways to exercise. You can walk, run, swim, or play sports. Even dancing and gardening count as exercise. The key is to find something you enjoy and do it consistently.',
            'Technology has changed our lives in many ways. We can now communicate with people all over the world instantly. The internet gives us access to vast amounts of information. Smartphones have become an essential part of daily life. While technology brings many benefits, we must use it wisely.',
            'Learning a new language opens many doors. It helps us understand different cultures and perspectives. When we learn another language, we also improve our memory and problem-solving skills. Many jobs require people who can speak multiple languages. Start learning a new language today, and you will see the benefits.',
            'Friendship is one of the most valuable things in life. Good friends support us through difficult times and celebrate our successes. They listen when we need to talk and offer advice when we need it. Building strong friendships takes time and effort, but the rewards are immeasurable. Cherish the friends you have.'
        ],
        high: [
            'The Industrial Revolution marked a turning point in human history. Beginning in the late 18th century, it transformed societies from agrarian to industrial economies. New inventions like the steam engine revolutionized transportation and manufacturing. While it brought unprecedented economic growth, it also created significant social challenges, including poor working conditions and environmental degradation.',
            'Climate change represents one of the greatest challenges facing humanity today. Rising global temperatures have led to more extreme weather events, melting ice caps, and rising sea levels. Scientists agree that human activities, particularly the burning of fossil fuels, are the primary cause. Addressing this issue requires global cooperation and significant changes to our energy systems.',
            'The Renaissance was a period of remarkable cultural and intellectual revival in Europe. Beginning in Italy in the 14th century, it spread across the continent over the next three centuries. Artists like Leonardo da Vinci and Michelangelo created masterpieces that still inspire awe today. Thinkers like Erasmus and Thomas More challenged traditional beliefs and laid the groundwork for the modern world.',
            'Artificial intelligence is transforming nearly every aspect of our lives. From recommendation systems to autonomous vehicles, AI technologies are becoming increasingly sophisticated. Machine learning algorithms can now perform complex tasks that once required human intelligence. While these advances offer tremendous benefits, they also raise important ethical questions about privacy, job displacement, and the nature of intelligence itself.',
            'Globalization has interconnected economies and cultures around the world. Goods, services, people, and ideas move across borders more freely than ever before. This interconnectedness has created economic opportunities and lifted many people out of poverty. However, it has also led to cultural homogenization and economic inequality. Navigating the challenges and opportunities of globalization remains one of the most important tasks of the 21st century.'
        ],
        daily: [
            'Good morning! How are you feeling today? Did you sleep well? What would you like to have for breakfast?',
            'Thank you very much for your help. I really appreciate it. You are always so kind and supportive.',
            'Excuse me, could you please help me find the nearest restroom? I am new here and don\'t know the way.',
            'I am sorry for being late. The traffic was terrible this morning. It won\'t happen again.',
            'Would you like to join me for lunch? I know a great restaurant nearby. Their food is excellent.'
        ],
        classics: [
            'I think, therefore I am. - René Descartes',
            'The only true wisdom is in knowing you know nothing. - Socrates',
            'In the middle of difficulty lies opportunity. - Albert Einstein',
            'Life is what happens when you\'re busy making other plans. - John Lennon',
            'The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt'
        ]
    },
    chinese: {
        elementary: [
            '我有一个好朋友，他叫小明。我们一起上学，一起玩耍。小明喜欢踢足球，我喜欢画画。我们经常互相帮助，分享快乐。有这样的好朋友，我感到非常开心。',
            '今天是星期六，天气很好。我和爸爸妈妈去公园玩。公园里有很多花，五颜六色的，真美丽。我看到了小鸟在树上唱歌，小鱼在水里游泳。我们拍了很多照片，玩得很开心。',
            '我喜欢读书，书里有很多有趣的故事。读《西游记》时，我佩服孙悟空的勇敢。读《三国演义》时，我敬佩诸葛亮的聪明。读书让我学到了很多知识，也让我明白了很多道理。',
            '春天来了，天气变暖了。小草从地里钻出来，嫩绿嫩绿的。柳树长出了新芽，随风摆动。小鸟从南方飞回来了，叽叽喳喳地叫着。小朋友们脱掉了厚衣服，高兴地跑出去玩。',
            '我学会了骑自行车。刚开始的时候，我总是摔倒，很害怕。爸爸鼓励我说：不要怕，多练习就会了。于是我每天都练习，终于学会了。现在我骑着自行车，感觉像飞一样，真开心！'
        ],
        middle: [
            '生活就像一面镜子，你对它笑，它就对你笑；你对它哭，它也对你哭。我们要用积极的心态面对生活中的困难和挑战。遇到挫折时，不要灰心丧气，要相信自己能够克服困难。保持乐观的态度，生活会变得更加美好。',
            '时间是最宝贵的财富，它不会因为任何人而停留。古人说：一寸光阴一寸金，寸金难买寸光阴。我们要珍惜每一分每一秒，不要虚度年华。努力学习，不断进步，让有限的生命绽放出无限的光彩。',
            '友谊是人生中最美好的情感之一。真正的朋友会在你成功时为你祝福，在你失败时给你鼓励，在你需要帮助时伸出援手。友谊需要真诚、信任和理解来维系。拥有知心朋友，是人生的一大幸事。',
            '大自然是人类最珍贵的礼物。蓝天白云，青山绿水，都是大自然赐予我们的宝贵财富。我们应该保护好环境，与自然和谐相处。节约资源，减少污染，让我们的地球变得更加美丽，让后代子孙也能享受大自然的美好。',
            '学习是一个永无止境的过程。古人云：活到老，学到老。无论我们年龄多大，都应该保持学习的热情。通过学习，我们可以不断充实自己，提高自己。学习不仅能增长知识，还能开阔视野，让我们的人生更加丰富多彩。'
        ],
        high: [
            '中国传统文化源远流长，博大精深。从诗词歌赋到琴棋书画，从哲学思想到中医理论，无不展现着古人的智慧。儒家的仁、道家的道、佛家的空，这些思想不仅影响了中国，也影响了世界。在现代社会，我们应该传承和弘扬传统文化，让它焕发出新的生命力。',
            '改革开放四十年来，中国发生了翻天覆地的变化。经济快速发展，人民生活水平显著提高，科技实力不断增强。从中国制造到中国创造，从跟跑到领跑，中国正在以崭新的姿态走向世界舞台的中心。这一切成就的取得，离不开中国人民的辛勤努力和不懈奋斗。',
            '在这个信息爆炸的时代，我们每天都在接收大量的信息。如何辨别信息的真伪，如何筛选有用的信息，成为了现代人必备的技能。独立思考能力变得尤为重要。我们不能盲目跟风，不能轻信谣言，要学会用自己的头脑去思考，用理性的眼光去判断。',
            '创新是推动社会发展的重要力量。纵观历史，每一次重大的科技革命都带来了生产力的飞跃。从蒸汽机的发明到电力的应用，从计算机的普及到人工智能的兴起，创新改变了人类的生活方式。在当今竞争激烈的时代，只有不断创新，才能在竞争中立于不败之地。',
            '全球化是当今世界发展的必然趋势。各国之间的联系日益紧密，经济、文化、科技等领域的交流合作不断深化。全球化带来了机遇，也带来了挑战。在这个过程中，我们应该保持开放的心态，积极参与国际合作与竞争，同时也要保护好自己的文化特色和国家利益。'
        ],
        daily: [
            '早上好！今天天气不错，适合出去走走。你今天有什么安排吗？',
            '谢谢你的帮助！如果没有你的支持，我真不知道该怎么办才好。',
            '请问洗手间在哪里？我是第一次来这里，不太熟悉路况。',
            '抱歉让你久等了，路上堵车耽误了时间，真的很不好意思。',
            '一起去吃午饭怎么样？我知道附近有一家新开的餐厅，味道很不错。'
        ],
        classics: [
            '三人行，必有我师焉。择其善者而从之，其不善者而改之。——《论语》',
            '天下兴亡，匹夫有责。——顾炎武',
            '天将降大任于斯人也，必先苦其心志，劳其筋骨。——《孟子》',
            '路漫漫其修远兮，吾将上下而求索。——屈原《离骚》',
            '己所不欲，勿施于人。——《论语》'
        ]
    }
};
