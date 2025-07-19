import {
    DeepSeek,
    Claude,
    Qwen,
    AzureAI,
    Ollama,
    Gemini,
    OpenAI
} from '@lobehub/icons'

export const LLMs = [
    {
        name: 'DeepSeek',
        desc: 'DeepSeek is a Chinese company that provides a large language model.',
        logo: <DeepSeek.Color size={24} />,
        connected: false
    },
    {
        name: 'Claude',
        desc: 'Claude is a French company that provides a large language model.',
        logo: <Claude.Color size={24} />,
        connected: false
    },
    {
        name: 'Qwen',
        desc: 'Qwen is a Chinese company that provides a large language model.',
        logo: <Qwen.Color size={24} />,
        connected: false
    },
    {
        name: 'AzureAI',
        desc: 'AzureAI is a cloud-based AI platform that provides a large language model.',
        logo: <AzureAI.Color size={24} />,
        connected: false
    },
    {
        name: 'Ollama',
        desc: 'Ollama is a small language model that can be run locally.',
        logo: <Ollama size={24} />,
        connected: false
    },
    {
        name: 'Gemini',
        desc: 'Gemini is a Google company that provides a large language model.',
        logo: <Gemini.Color size={24} />,
        connected: false
    },
    {
        name: 'OpenAI',
        desc: 'OpenAI is a company that provides a large language model.',
        logo: <OpenAI size={24} />,
        connected: false
    },
    {
        name: 'Unknown',
        desc: 'Unknown is a unknown company that provides a large language model.',
        logo: null,
        connected: false
    }
]