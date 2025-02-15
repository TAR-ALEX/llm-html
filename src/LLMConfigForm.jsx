import React from 'react';
import { Container, Row } from 'react-bootstrap';
import FormComponent from './FormComponent';
import { placeholder } from '@codemirror/view';

// Testing component
const LLMConfigForm = ({initialState, onSubmit, onCancel}) => {
  return(
  <Container fluid className="h-100 d-flex flex-column">
    {/* <Row><h1 className="text-center my-4">LLM Configuration Generator</h1><div /></Row> */}
    <Row className="flex-grow-1 overflow-auto"><FormComponent formConfig={llmConfigSchema} initialState={initialState} onSubmit={onSubmit} onCancel={onCancel} /></Row>
  </Container>
  )};

export default LLMConfigForm;

const llmConfigSchema = [
  {
    label: 'API Parameters',
    fields: [
      {
        name: 'name',
        label: 'Nickname',
        type: 'text',
        defaultValue: 'Default LLM',
        description: 'shortname to be displayed when selecting this model',
        placeholder: 'e.g., LLaMA'
      },
      {
        name: 'baseURL',
        label: 'API URL',
        type: 'text',
        defaultValue: 'http://localhost:8080/v1/chat/completions',
        description: 'Url of the openai compatible endpooint supporting /completions',
        placeholder: 'e.g., http://localhost:8080/v1/chat/completions'
      },
      {
        name: 'apiKey',
        label: 'API Key',
        optional: true,
        type: 'text',
        description: 'Key for the openai compatible endpooint USE AT YOUR OWN RISK, STORED IN THE BROWSER CACHE!',
        placeholder: 'e.g., password123'
      },
      {
        name: 'model',
        label: 'Model Name',
        optional: true,
        type: 'text',
        description: 'Name of the model to use',
        placeholder: 'e.g., llama3'
      },
    ],
  },
  {
    label: 'Basic Parameters',
    fields: [
      {
        name: 'defaultSystemPrompt',
        label: 'Default System Prompt',
        type: 'textarea',
        optional: true,
        description: 'Provide the prompt for this completion as a string or as an array of strings or numbers representing tokens.',
        placeholder: 'You are a helpful assistant.',
        defaultValue: 'You are a helpful assistant.'
      },
      {
        name: 'thinking_escapes',
        label: 'Thinking Escapes',
        type: 'json',
        optional: true,
        description: 'Escape Sequences for thinking tokens in json',
        placeholder: '{"start": "<think>", "end": "</think>"}',
      },
      {
        name: 'mask_thinking',
        label: 'Mask Thinking',
        type: 'boolean',
        optional: true,
        description: 'Remove Thinking from API calls. Model does not see its previous thought process making context longer. False if disabled',
        // defaultValue: false,
        placeholder: "false",
      },
      {
        name: 'temperature',
        label: 'Temperature',
        optional: true,
        type: 'slider',
        step: 0.1,
        min: 0,
        max: 1,
        placeholder: 0.8,
        description: 'Adjust the randomness of the generated text'
      },
      {
        name: 'top_k',
        label: 'Top K',
        type: 'number',
        optional: true,
        min: 1,
        //defaultValue: 40,
        placeholder: 40,
        description: 'Limit the next token selection to the K most probable tokens'
      },
      {
        name: 'top_p',
        label: 'Top P',
        type: 'number',
        optional: true,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: 0.95,
        description: 'Limit next token selection to tokens with cumulative probability above P'
      },
      {
        name: 'min_p',
        label: 'Min P',
        type: 'number',
        optional: true,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: 0.05,
        description: 'The minimum probability for a token to be considered, relative to the probability of the most likely token'
      },
      {
        name: 'n_predict',
        label: 'Max Tokens',
        type: 'number',
        optional: true,
        min: -1,
        placeholder: -1,
        description: 'Maximum number of tokens to predict (-1 for infinity)'
      },
      // {
      //   name: 'stream',
      //   label: 'Stream',
      //   type: 'boolean',
      //   optional: true,
      //   defaultValue: false,
      //   description: 'Enable real-time token streaming'
      // },
      {
        name: 'stop',
        label: 'Stop',
        type: 'json',
        optional: true,
        placeholder: '["endtoken1", "endtoken2"]',
        description: 'Specify a JSON array of stopping strings. These words will not be included in the completion.'
      },
      {
        name: 'typical_p',
        label: 'Typical P',
        type: 'number',
        optional: true,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: 1.0,
        description: 'Enable locally typical sampling with parameter p'
      },
      {
        name: 'n_keep',
        label: 'N Keep',
        type: 'number',
        optional: true,
        min: -1,
        placeholder: 0,
        description: 'Specify the number of tokens from the prompt to retain when the context size is exceeded and tokens need to be discarded.'
      },
      {
        name: 'n_indent',
        label: 'N Indent',
        type: 'number',
        optional: true,
        min: 0,
        placeholder: 0,
        description: 'Specify the minimum line indentation for the generated text in number of whitespace characters.'
      }
    ]
  },
  {
    label: 'Advanced Parameters',
    fields: [
      {
        name: 'dynatemp_range',
        label: 'Dynamic Temperature Range',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 0.0,
        description: 'Range for dynamic temperature adjustment'
      },
      {
        name: 'dynatemp_exponent',
        label: 'Dynamic Temperature Exponent',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 1.0,
        description: 'Dynamic temperature exponent'
      },
      {
        name: 'mirostat',
        label: 'Mirostat',
        type: 'select',
        optional: true,
        //defaultValue: 0,
        options: [
          { value: 0, label: 'Disabled' },
          { value: 1, label: 'Mirostat 1' },
          { value: 2, label: 'Mirostat 2' }
        ]
      },
      {
        name: 'mirostat_tau',
        label: 'Mirostat Tau',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 5.0,
        description: 'Set the Mirostat target entropy, parameter tau'
      },
      {
        name: 'mirostat_eta',
        label: 'Mirostat Eta',
        type: 'number',
        optional: true,
        step: 0.01,
        min: 0,
        placeholder: 0.1,
        description: 'Set the Mirostat learning rate, parameter eta'
      },
      {
        name: 'repeat_penalty',
        label: 'Repeat Penalty',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 1.1,
        description: 'Control repetition of token sequences'
      },
      {
        name: 'repeat_last_n',
        label: 'Repeat Last N',
        type: 'number',
        optional: true,
        min: -1,
        placeholder: 64,
        description: 'Last n tokens to consider for penalizing repetition'
      },
      {
        name: 'presence_penalty',
        label: 'Presence Penalty',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 0.0,
        description: 'Penalty for new token presence'
      },
      {
        name: 'frequency_penalty',
        label: 'Frequency Penalty',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 0.0,
        description: 'Penalty for token frequency'
      },
      {
        name: 'dry_multiplier',
        label: 'DRY Multiplier',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 0.0,
        description: 'Set the DRY repetition penalty multiplier'
      },
      {
        name: 'dry_base',
        label: 'DRY Base',
        type: 'number',
        optional: true,
        step: 0.1,
        min: 0,
        placeholder: 1.75,
        description: 'Set the DRY repetition penalty base value'
      },
      {
        name: 'dry_allowed_length',
        label: 'DRY Allowed Length',
        type: 'number',
        optional: true,
        min: 0,
        placeholder: 2,
        description: 'Tokens that extend repetition beyond this receive exponentially increasing penalty'
      },
      {
        name: 'dry_penalty_last_n',
        label: 'DRY Penalty Last N',
        type: 'number',
        optional: true,
        min: -1,
        placeholder: -1,
        description: 'How many tokens to scan for repetitions'
      },
      {
        name: 'dry_sequence_breakers',
        label: 'DRY Sequence Breakers',
        type: 'json',
        optional: true,
        placeholder: "['\\n', ':', '\"', '*']",
        description: 'Specify an array of sequence breakers for DRY sampling'
      },
      {
        name: 'xtc_probability',
        label: 'XTC Probability',
        type: 'number',
        optional: true,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: 0.0,
        description: 'Set the chance for token removal via XTC sampler'
      },
      {
        name: 'xtc_threshold',
        label: 'XTC Threshold',
        type: 'number',
        optional: true,
        step: 0.01,
        min: 0,
        max: 1,
        placeholder: 0.1,
        description: 'Set a minimum probability threshold for tokens to be removed via XTC sampler'
      },
      {
        name: 'grammar',
        label: 'Grammar',
        type: 'textarea',
        optional: true,
        placeholder: 'root ::= "My single line response is: " single-line\nsingle-line ::= [^\\n]+ "\\n"',
        description: 'Set grammar for grammar-based sampling'
      },
      {
        name: 'json_schema',
        label: 'JSON Schema',
        type: 'json',
        optional: true,
        placeholder: '{"items": {"type": "string"}, "minItems": 10, "maxItems": 100}',
        description: 'Set a JSON schema for grammar-based sampling'
      },
      {
        name: 'seed',
        label: 'Seed',
        type: 'number',
        optional: true,
        min: -1,
        placeholder: -1,
        description: 'Set the random number generator (RNG) seed'
      },
      {
        name: 'ignore_eos',
        label: 'Ignore EOS',
        type: 'boolean',
        optional: true,
        placeholder: false,
        description: 'Ignore end of stream token and continue generating'
      },
      {
        name: 'logit_bias',
        label: 'Logit Bias',
        type: 'json',
        optional: true,
        placeholder: '[["Hello, World!",-0.5]]',
        description: 'Modify the likelihood of a token appearing in the generated text completion'
      },
      {
        name: 'n_probs',
        label: 'N Probs',
        type: 'number',
        optional: true,
        min: 0,
        placeholder: 0,
        description: 'If greater than 0, the response also contains the probabilities of top N tokens for each generated token'
      },
      {
        name: 'min_keep',
        label: 'Min Keep',
        type: 'number',
        optional: true,
        min: 0,
        placeholder: 0,
        description: 'If greater than 0, force samplers to return N possible tokens at minimum'
      },
      {
        name: 't_max_predict_ms',
        label: 'T Max Predict MS',
        type: 'number',
        optional: true,
        min: 0,
        placeholder: 0,
        description: 'Set a time limit in milliseconds for the prediction phase'
      },
      // {
      //   name: 'image_data',
      //   label: 'Image Data',
      //   type: 'textarea',
      //   optional: true,
      //   placeholder: [],
      //   description: 'An array of objects to hold base64-encoded image data and its ids to be referenced in prompt'
      // },
      {
        name: 'id_slot',
        label: 'ID Slot',
        type: 'number',
        optional: true,
        min: -1,
        placeholder: -1,
        description: 'Assign the completion task to a specific slot'
      },
      {
        name: 'cache_prompt',
        label: 'Cache Prompt',
        type: 'boolean',
        optional: true,
        placeholder: true,
        description: 'Re-use KV cache from a previous request if possible'
      },
      {
        name: 'return_tokens',
        label: 'Return Tokens',
        type: 'boolean',
        optional: true,
        placeholder: false,
        description: 'Return the raw generated token ids in the tokens field'
      },
      {
        name: 'samplers',
        label: 'Samplers',
        type: 'json',
        optional: true,
        placeholder: '["dry", "top_k", "typ_p", "top_p", "min_p", "xtc", "temperature"]',
        description: 'The order the samplers should be applied in'
      },
      {
        name: 'timings_per_token',
        label: 'Timings Per Token',
        type: 'boolean',
        optional: true,
        placeholder: false,
        description: 'Include prompt processing and text generation speed information in each response'
      },
      {
        name: 'post_sampling_probs',
        label: 'Post Sampling Probs',
        type: 'boolean',
        optional: true,
        placeholder: false,
        description: 'Returns the probabilities of top n_probs tokens after applying sampling chain'
      },
      {
        name: 'response_fields',
        label: 'Response Fields',
        type: 'json',
        optional: true,
        placeholder: '["content", "generation_settings/n_predict"]',
        description: 'A list of response fields to include in the response'
      },
      {
        name: 'lora',
        label: 'LoRA',
        type: 'json',
        optional: true,
        placeholder: '[{"id": 0, "scale": 0.5}, {"id": 1, "scale": 1.1}]',
        description: 'A list of LoRA adapters to be applied to this specific request'
      },
      {
        name: 'include_reasoning',
        label: 'Include Reasoning',
        type: 'boolean',
        optional: true,
        placeholder: false,
        description: 'include reasoning in openrouter'
      }
    ]
  }
];