import { LitElement, html, css } from 'lit-element';
import '@dile/dile-modal/dile-modal';
import '../forms/art-button';
import '../art-inline-feedback';

class ArtLoginModal  extends LitElement {

    static get styles() {
        return css`
          dile-modal {
              --dile-modal-background-color: rgba(230,230,230, 0.85);
              --dile-modal-content-background-color: #fff;
              --dile-modal-height: 100vh;
              --dile-modal-width: 100vw;
              --dile-modal-border-radius: 0;
              --dile-modal-close-icon-size: 32px;
              --dile-modal-content-padding: 1.5em;
              --dile-modal-close-icon-color: var(--secondary-color);
              --dile-modal-content-shadow-color: #ccc;
            }
            @media (min-width: 380px) {
              dile-modal {
                --dile-modal-height: auto;
                --dile-modal-width: 340px;
                --dile-modal-border-radius: 10px;
              }
            }
    
            h4 {
              font-size: 1.2em;
              font-weight: 300;
              margin: -5px 0 10px 2px;
            }
    
            label {
              width: 100px;
              display: inline-block;
            }
            .actions {
              border-bottom: 1px solid #d5e5f5;
              display: flex;
              align-items: flex-start;
              padding-bottom: 6px;
            }
            a {
              text-decoration: none;
              color: #039be5;
            }
            art-inline-feedback {
              margin: 5px 0 0px;
            }
            .utils {
              margin-top: 5px;
              font-size: 12pt;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
            }
            .utils a {
              margin-top: 10px;
              text-align: center;
              display: block;
              margin-bottom: 5px;
            }
            art-button {
              margin: 8px 0;
              font-size: 0.9em;
            }
        `;
      }
    
      stateChanged(state) {
        this.opened = state.app.loginrMenuOpened;
        if (this.opened) {
          this.elmodal.open();
        } else if (this.elmodal && this.elmodal.opened) {
          this.elmodal.close();
        }
      }
    
      static get properties() {
        return { 
          opened: { type: Boolean },
          loggedIn: { type: Boolean },
        };
      }
    
      constructor() {
        super();
        this.loginData = {
          email: "",
          password: "",
          remember: ""
        };
      }
    
      firstUpdated() {
        this.elmodal = this.shadowRoot.getElementById("elmodal");
        this.feedbackElement = this.shadowRoot.getElementById("feedback");
      }
    
      render() {
        return html`
          <dile-modal id="elmodal" showCloseIcon @dile-modal-closed="${this.onModalClosed}">
            <h4>Introduce email y clave</h4>
            <div class="inputs">
              <slot></slot>
    
              <dile-checkbox id="remembercheck">Recordarme</dile-checkbox>
            </div>
    
            <art-inline-feedback id="feedback"></art-inline-feedback>
    
            <div class="actions">
              <art-button @click="${this.submit}">Entrar</art-button>
            </div>
    
            <div class="utils">
              <a href="/password/reset">¿Olvidaste la clave?</a>
              <a href="/register">Registrarse</a>
            </div>
          </dile-modal>
        `;
      }
    
      open() {
        console.log("abrir modal");
        this.elmodal.open();
      }
    
      getInputValue(id) {
        return document.getElementById(id).value;
      }
    
      submit() {
        this.feedbackElement.clear();
    
        if (this.loggedIn) {
          this.feedbackElement.negativeFeedback("Ya has hecho login");
          return false;
        }
    
        this.loginData.email = this.getInputValue("loginemail");
        this.loginData.password = this.getInputValue("loginpass");
    
        if (this.shadowRoot.getElementById("remembercheck").checked) {
          this.loginData.remember = "on";
        } else {
          this.loginData.remember = "";
        }
    
        console.log('datos para el login', this.loginData);
    
        axios.post('/template_laravel/public/login', this.loginData)
          .then( response => {
            if (response.status == 200) {
              console.log('Login realizado correctamente' , response.data);
              this.elmodal.close();

               this.updateTokens(response.data.token);
              /*store.dispatch(logUser(response.data.user)); */
            } else {
              this.feedbackElement.negativeFeedback("Se ha denegado");
            }
          })
          .catch(err => {
            console.log('errrrrror', err.response);
            let res = err.response;
            if (!res) {
              this.feedbackElement.negativeFeedback(
                "No se pudo conectar con el servidor"
              );
              return false;
            }
            switch (res.status) {
              case 422:
                if (res.data) {
                  let errors = res.data.errors;
                  if (errors.email) {
                    this.feedbackElement.negativeFeedback(errors.email[0]);
                  } else if (errors.password) {
                    this.feedbackElement.negativeFeedback(errors.password[0]);
                  }
                }
                break;
              case 429:
                this.feedbackElement.negativeFeedback(
                  "Demasiados intentos fallidos. Prueba más tarde."
                );
                break;
              case 403:
                this.feedbackElement.neutralFeedback("Operación no permitida");
                break;
              case 419:
                this.feedbackElement.negativeFeedback(
                  "Sesión caducada. Actualiza la página"
                );
                break;
              default:
                this.feedbackElement.negativeFeedback(
                  "Error Genérico..."
                );
            }
          });
    
      }
    
      updateTokens(token) {
        console.log("token", token);
        window.axios.defaults.headers.common["X-CSRF-TOKEN"] = token;
        document.querySelector("#logout-form input[name=_token]").value = token;
      }
    
      onModalClosed() {
        //store.dispatch(changeLoginVisibility(false));
      }
}

customElements.define('art-login-modal', ArtLoginModal);