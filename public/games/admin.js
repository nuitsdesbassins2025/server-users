import { admin_emit_event } from "/app.js";

export function initGame() {
  const buttonContainer = document.getElementById('button-container');

  // Function to create and append a button and its data inputs to the container
  function createButton(button) {
    const btnContainer = document.createElement('div');
    btnContainer.style.marginBottom = '10px';

    const btn = document.createElement('button');
    btn.textContent = button.label;

    // Create a container for input elements associated with the button
    const inputContainer = document.createElement('div');
    inputContainer.style.marginTop = '5px';

    // Create input elements based on the datas array
    let inputElements = {}; // Store created input elements to access their values later
    if (button.datas && Array.isArray(button.datas)) {
      button.datas.forEach(data => {
        const label = document.createElement('label');
        label.textContent = `${data.name}: `;
        let input;

        if (data.type === 'range') {
          input = document.createElement('input');
          input.type = 'range';
          input.min = data.min || 0;
          input.max = data.max || 100;
          input.value = data.value || 50;
          const span = document.createElement('span');
          span.textContent = input.value;
          input.addEventListener('input', () => {
            span.textContent = input.value;
          });
          label.appendChild(span);
        } else if (data.type === 'text') {
          input = document.createElement('input');
          input.type = 'text';
          input.placeholder = data.name;
        } else if (data.type === 'number') {
          input = document.createElement('input');
          input.type = 'number';
          input.placeholder = data.name;
        }
        label.appendChild(input);
        inputContainer.appendChild(label);
        inputContainer.appendChild(document.createElement('br'));
        inputElements[data.name] = input; // Store input reference
      });
    }

    // On button click, collect input values and emit event
    btn.onclick = () => {
      const datas = {}; // Initialize datas object

      // Collect values from input elements
      Object.keys(inputElements).forEach(key => {
        const input = inputElements[key];
        if (input.type === 'range' || input.type === 'number') {
          datas[key] = parseFloat(input.value);
        } else {
          datas[key] = input.value;
        }
      });
      admin_emit_event("admin_game_settings",button.id, datas);
    };

    btnContainer.appendChild(btn);
    btnContainer.appendChild(inputContainer);
    buttonContainer.appendChild(btnContainer);
  }

  // Define the buttons needed
  var buttons_needed = [
    {id:"grid_toogle", label:"Grille On/Off"},
    {id:"clear_drawings", label:"Effacer le dessin"},
    {id:"clear_balls", label:"Effacer les balles"},
    {id:"reset_game", label:"Reset jeu"},
    {id:"spawn_ball", label:"add one ball"},
    {id:"remove_big_balls", label:"add one enlever big ball"},
    {id:"hide_players", label:"cacher/montrer les joueurs"},
    {id:"declencher_buts", label:"déclencher des buts"},
    {id:"add_blackhole", label:"ajouter un trou noir"},
    {id:"remove_all_blackholes", label:"enlever tous les trous noirs"},
    {id:"set_player_scale", label:"taille des joueurs",
      datas: [{name: "scale", type: "range", min: 10, max: 200, value:50}]
    },
    {id:"toogle_player_text", label:"player id / player pos"},
    {id:"set_ball_size", label:"taille de la balle",
      datas: [{name: "scale", type: "range", min: 10, max: 200, value:50}]
    },
    {id:"custom_text", label:"Texte personnalisé",
      datas: [{name: "text_value", type: "text"}]
    },
    {id:"custom_number", label:"Nombre personnalisé",
      datas: [{name: "number_value", type: "number"}]
    }
  ];

  // Generate buttons dynamically
  buttons_needed.forEach(button => createButton(button));


}

window.initGame = initGame;
