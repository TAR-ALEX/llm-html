//import viteLogo from './assets/vite.svg?url'
// import 'bootstrap/dist/css/bootstrap.min.css';
import MergeComponent from './MergeComponent'
import Container from 'react-bootstrap/Container';
import TextEditor from './TextEditor';
import ChatDrawer from './ChatDrawer';
import OpenAI from 'openai';
import CacheClearer from './CacheClearer';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';

function App() {
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

  const [modalMessage, setModalMessage] = useState(null);

  const onError = (header: string, content: string) => { setModalMessage({ header: header, content: content }); };

  var modal = <></>;

  if (modalMessage !== null) {
    modal = <Modal
      show={modalMessage !== null}
      onHide={() => setModalMessage(null)}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          {modalMessage.header ?? ""}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {modalMessage.content ?? ""}
          </div>
        </p>
      </Modal.Body>
      {/* <Modal.Footer>
        <Button onClick={props.onHide}>Close</Button>
      </Modal.Footer> */}
    </Modal>;
  }

  return <>
    {/* <LLMConfigForm onSubmit={handleSubmit}/> */}
    {modal}
    <ChatDrawer onError={onError} />
    {/* <CacheClearer/> */}
  </>;
}

export default App
