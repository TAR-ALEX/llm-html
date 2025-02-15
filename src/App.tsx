//import viteLogo from './assets/vite.svg?url'
import 'bootstrap/dist/css/bootstrap.min.css';
import MergeComponent from './MergeComponent'
import Container from 'react-bootstrap/Container';
import './App.scss';
import TextEditor from './TextEditor';
import ChatDrawer from './ChatDrawer';
import OpenAI from 'openai';
import LLMConfigForm from './LLMConfigForm'
import CacheClearer from './CacheClearer';

function App() {
  []
  // return (
  //   <>
  //     <div className="App">
  //       <Container>
  //       <TextEditor mainText={'asdfasdf'} suggestedText={'hey'} onChange={function (merged: string): void {
  //           console.log(merged);
  //         } } />
  //       </Container>
  //     </div>
  //   </>
  // )

  const handleSubmit = (data: any) => {console.log(data);};

  return <>
  {/* <LLMConfigForm onSubmit={handleSubmit}/> */}
    <ChatDrawer/>
    {/* <CacheClearer/> */}
  </>;
}

export default App
