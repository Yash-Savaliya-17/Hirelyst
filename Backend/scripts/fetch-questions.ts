import fetch from 'node-fetch';
import * as https from 'https';
import * as cheerio from 'cheerio';
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

const agent = new https.Agent({
    rejectUnauthorized: false
});

const options = {
    method: 'GET',
    headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'cookie': '_ga=GA1.1.1468319653.1722536742; __gads=ID=5f9bc93508f790b7:T=1722536956:RT=1722536956:S=ALNI_MYhvmalZpVm1N5Lr7BD8lXtoMNpSQ; __gpi=UID=00000eb12903b85e:T=1722536956:RT=1722536956:S=ALNI_MbVF2PGUIcJTLNL_KD8xHsjfkejOw; __eoi=ID=2fec4dad3817f71c:T=1722536956:RT=1722536956:S=AA-Afjaw05OyWc31JwciHEr6K2Po; _ga_E20ELFGHR5=GS1.1.1722542665.2.1.1722543152.60.0.0; FCNEC=%5B%5B%22AKsRol9alwgciyp2SY5o4KWPyiam8gMRUs4lon_I7dFeXd47jOfUr-pV4gyHPkgWUdtOFaARzfdxBIRzwJYAu62BIMLMWWuo5WrOHFUrnyfKPDJTWrwGUcUj6gWZs9-4uGa-M5lrTmVd3MMzwVU49N589rhoRdzXkA%3D%3D%22%5D%5D',
        'priority': 'u=0, i',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
    },
    agent: agent
};

const links = [
    'https://www.indiabix.com/java-programming/language-fundamentals/',
    'https://www.indiabix.com/java-programming/operators-and-assignments/',
    'https://www.indiabix.com/java-programming/exceptions/',
    'https://www.indiabix.com/java-programming/flow-control/',
    'https://www.indiabix.com/aptitude/problems-on-trains/',
    'https://www.indiabix.com/aptitude/time-and-distance/',
    'https://www.indiabix.com/aptitude/height-and-distance/',
    'https://www.indiabix.com/aptitude/simple-interest/',
    'https://www.indiabix.com/cpp-programming/oops-concepts/',
    'https://www.indiabix.com/cpp-programming/functions/',
    'https://www.indiabix.com/cpp-programming/references/',
    'https://www.indiabix.com/cpp-programming/objects-and-classes/',
    'https://www.indiabix.com/digital-electronics/digital-concepts/',
    'https://www.indiabix.com/c-sharp-programming/dot-net-framework/',
    'https://www.indiabix.com/c-sharp-programming/datatypes/',
    'https://indiabix.com/c-sharp-programming/operators/'
]

const fetchQuestionsAndSave = async (url: string) => {
    const response = await fetch(url, options);
    const data = await response.text();
    const $ = cheerio.load(data);

    const arr = [];
    const subName = $('.breadcrumb-item:nth-child(2)').text().trim();
    const topicName = $('.breadcrumb-item:nth-child(3)').text().trim();

    $('.row:nth-child(2)').each((index, element) => {
        $(element).find('.bix-div-container').each((index, element) => {
            const question = $(element).find('.bix-td-qtxt').text().trim();
            const options = [];
            $(element).find('.bix-td-option-val').each((index, element) => {
                options.push($(element).text().trim());
            });
            const answer = $(element).find('.bix-td-miscell input').attr('value');

            arr.push({ question, options, answer, subject: subName, topic: topicName, createdBy: 15 });
        });
    });

    console.log(arr, subName, topicName);

    const subject = await prisma.questionSubject.upsert({
        where: {
            name: subName,
        },
        update: {},  // No update operation, as you just want to ensure it exists
        create: {
            name: subName,
        },
    });

    const topic = await prisma.questionTopic.upsert({
        where: {
            name_subjectId: {
                name: topicName,
                subjectId: subject.sys_id,
            }
        },
        update: {},  // No update operation, as you just want to ensure it exists
        create: {
            name: topicName,
            subjectId: subject.sys_id,
        },
    });

    for (const item of arr) {
        const question = await prisma.question.create({
            data: {
                question: item.question,
                answer: item.answer,
                topicId: topic.sys_id,
                subjectId: subject.sys_id,
                createdById: 1,
                options: {
                    create: item.options.map((option, index) => {
                        return {
                            option,
                            isCorrect: item.answer === index.toString(),
                        };
                    }),
                },
            },
        });
        console.log(question);
    }
};

(async () => {
    for (const link of links) {
        await fetchQuestionsAndSave(link);
    }
})();
