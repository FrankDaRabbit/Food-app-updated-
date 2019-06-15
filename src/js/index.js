import Search from './models/Search';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import List from './models/List';
import Recipe from './models/Recipe';
import Likes from './models/Likes';
import { elements, renderLoader, clearLoader } from './views/base';



// ****** Global state of the app  ********
/*-Search object
/--Current resipe object
/--Shopping list object
/-- Liked recipes
*/
const state = {

};
window.state = state;

//**
//          SEARCH CONTROLLER
//*/
const controlSearch = async () => {
    // 1) get query from view
    const query = searchView.getInput();
    console.log(query);
    if (query) {
        // 2) new search object and update to state
        state.search = new Search(query);
        // 3) prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            // 4) search for recipes
            await state.search.getResults();

            // 5) render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);

        } catch (error) {
            alert('something went wrong');
            clearLoader();
        }

    }

}
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});



elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest(".btn-inline");
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
})

//**
//          RECIPE CONTROLLER
//*/
const controlRecipe = async () => {

    // Get it from url with hash

    const id = window.location.hash.replace('#', '');
    console.log(id);
    if (id) {
        //prepare UI for changes

        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Highlight selected search item
        if (state.search) searchView.highlightedSelected(id);

        //Create new recipe obj

        state.recipe = new Recipe(id);




        try {
            //Get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //Calc time and servings
            state.recipe.calcTime();
            state.recipe.calcServings();
            //Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );
        } catch (error) {
            alert('Error processing recipe! Probably APLI limit reached');
        }



    }

}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIST CONTROLLER
 */

const controlList = () => {
    // create new list if there is none
    if (!state.list) state.list = new List();

    // add each ingredient to list and UI

    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item)
    })

}


// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // hadle delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        state.list.deleteItem(id); // delete from state
        listView.deleteItem(id); //delete from UI
        //handle count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
})

/**
 * LIKE CONTROLLER
 */
// Just for testing 
//state.likes = new Likes();
//likesView.toggleLikeMenu(state.likes.getNumLikes());


const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    // user HAS NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {

        // add like to the state
        const newLike = state.likes.addLike(currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // toggle like button
        likesView.toggleLikeBtn(true);

        //add like to the UI list
        likesView.renderLike(newLike);
        console.log(state.likes)

        // User HAS liked current recipe
    } else {
        // remove like to the state
        state.likes.deleteLike(currentID);

        // toggle like button
        likesView.toggleLikeBtn(false);

        //remove like to the UI list
        likesView.deleteLike(currentID);
        console.log(state.likes)
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore like recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    // restore lieks
    state.likes.readStorage();

    //toggle like menu button

    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // render existing lieks
    state.likes.likes.forEach(like => likesView.renderLike(like));
})


// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // decrease button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to the shop list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // like controller
        controlLike();
    }

});


window.l = new List();